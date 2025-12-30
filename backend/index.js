import "dotenv/config";

import { hashPdf } from "./utils/hashPdf.js";
import { pdfToImages } from "./utils/pdfToImages.js";
import { uploadToGoogleDrive } from "./utils/uploadToGoogleDrive.js";
import { googleDrivePathInfo } from "./utils/googleDrivePathInfo.js";
import { listGoogleDriveFolder } from "./utils/listGoogleDriveFolder.js";
import { createGoogleDriveFolder } from "./utils/createGoogleDriveFolder.js";
import { getAuthUrl, createOAuth2Client, saveToken } from "./utils/googleDriveOAuth.js";
import { requireAuth } from "./middleware/auth.middleware.js";
import { requireRole } from "./middleware/role.middleware.js";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs-extra";
import multer from "multer";
import path from "path";
import pLimit from "p-limit";

import dashboardState from "./dashboardState.js";
import authRoutes from "./routes/auth.routes.js";
import tvRoutes from "./routes/tv.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import { saveDashboardState, loadDashboardState } from "./utils/saveDashboardState.js";

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ dest: "./tmp/uploads" });

const allowedOrigins = [
  'https://vaibhav8844.github.io',
  'https://ccpd-tv-final.onrender.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// ---------- Startup tmp cleanup (recommended) ----------
await fs.ensureDir("./tmp");

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: allowedOrigins,
    credentials: true
  } 
});

// Middleware to attach io to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(authRoutes);
app.use(tvRoutes);
app.use(dashboardRoutes);

// ---------- Socket ----------
io.on("connection", (socket) => {
  console.log("TV connected");
  socket.emit("INIT_STATE", dashboardState);
});

// ---------- APIs ----------
// OAuth2 authorization route
app.get("/auth/google", (req, res) => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
});

// OAuth2 callback route
app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send("Authorization code not found");
  }

  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    saveToken(tokens);
    
    res.send(`
      <html>
        <head>
          <title>Authorization Successful</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            h1 { color: #4CAF50; }
            p { line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>✅ Authorization Successful!</h1>
          <p>You can now close this window and return to your application.</p>
          <p>The token has been saved and your Google Drive uploads will now work.</p>
          <p><strong>Next steps:</strong></p>
          <ul>
            <li>Return to your admin dashboard</li>
            <li>Try uploading a file to test the integration</li>
          </ul>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error getting token:", error);
    res.status(500).send("Error during authorization: " + error.message);
  }
});

// Proxy endpoint to serve Google Drive files without CORS issues
app.get("/proxy/drive/:fileId", async (req, res) => {
  const { fileId } = req.params;
  
  try {
    const { getDriveClient } = await import("./utils/googleDriveOAuth.js");
    const drive = await getDriveClient();
    
    const fileMeta = await drive.files.get({
      fileId: fileId,
      fields: 'mimeType'
    });
    
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );
    
    res.setHeader('Content-Type', fileMeta.data.mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    // Handle client disconnect
    const cleanup = () => {
      if (response.data && !response.data.destroyed) {
        response.data.destroy();
      }
    };

    req.on('close', cleanup);
    req.on('error', cleanup);

    // Handle stream errors (suppress EOF errors from client disconnects)
    response.data.on('error', (err) => {
      if (err.code !== 'EOF' && err.code !== 'EPIPE') {
        console.error("Stream error:", err);
      }
      cleanup();
    });

    res.on('error', (err) => {
      if (err.code !== 'EOF' && err.code !== 'EPIPE') {
        console.error("Response error:", err);
      }
      cleanup();
    });
    
    response.data.pipe(res);
    
  } catch (error) {
    console.error("Proxy error:", error);
    if (!res.headersSent) {
      res.status(500).send("Failed to fetch file");
    }
  }
});

app.get("/dashboard-state",requireAuth,requireRole(["EDITOR", "VIEWER"]), (req, res) => {
  res.json(dashboardState);
});

app.post("/update-widget",requireAuth, async (req, res) => {
  const { widget, data } = req.body;

  if (!dashboardState.widgets[widget]) {
    return res.status(400).send({ error: "Invalid widget" });
  }

  dashboardState.widgets[widget] = data;
  
  // Notify connected clients
  io.emit("DASHBOARD_UPDATE", dashboardState);
  
  // Auto-save to Drive
  saveDashboardState(dashboardState).catch(err => 
    console.error("Auto-save failed:", err.message)
  );
  
  res.send({ success: true });
});

// ---------- Playlist Update ----------
app.post("/update-playlist",requireAuth,requireRole(["EDITOR"]), async (req, res) => {
  const { playlist } = req.body;

  try {
    const finalSlides = [];

    for (const item of playlist) {
      // -------- IMAGE --------
      if (item.type === "image") {
        finalSlides.push({
          type: "image",
          url: item.url,
          duration: item.duration,
        });
      }

      // -------- PDF --------
      if (item.type === "pdf") {
        const workDir = `./tmp/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

        try {
          await fs.ensureDir(workDir);

          const pdfPath = `${workDir}/input.pdf`;
          const response = await fetch(item.url);
          const buffer = await response.arrayBuffer();
          await fs.writeFile(pdfPath, Buffer.from(buffer));

          const hash = hashPdf(pdfPath);
          const folder = `slides/${hash}`;

          let imageUrls = [];

          const info = await googleDrivePathInfo(folder);
          if (info.exists && info.type === "folder") {
            imageUrls = await listGoogleDriveFolder(folder);
          } else {
            const images = await pdfToImages(pdfPath, workDir);

            for (let i = 0; i < images.length; i++) {
              const remote = `${folder}/page_${i + 1}.png`;
              const url = await uploadToGoogleDrive(images[i], remote);
              imageUrls.push(url);
            }
          }

          imageUrls.forEach((url) => {
            finalSlides.push({
              type: "image",
              url,
              duration: item.duration,
            });
          });
        } finally {
          // ✅ AUTO CLEANUP (always runs)
          await fs.remove(workDir);
        }
      }
    }

    dashboardState.widgets.mediaSlideshow = finalSlides;
    io.emit("DASHBOARD_UPDATE", dashboardState);

    // Auto-save to Drive
    saveDashboardState(dashboardState).catch(err => 
      console.error("Auto-save failed:", err.message)
    );

    res.send({ success: true, slides: finalSlides.length });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to update playlist" });
  }
});

app.post("/upload-audio",requireAuth,requireRole(["EDITOR"]), upload.single("file"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send({ error: "No file uploaded" });
  }

  try {
    const ext = path.extname(file.originalname).toLowerCase();
    const audioExts = [".mp3", ".wav", ".ogg", ".m4a"];

    if (!audioExts.includes(ext)) {
      await fs.remove(file.path);
      return res.status(400).send({ error: "Only audio files (.mp3, .wav, .ogg, .m4a) are allowed" });
    }

    // Use original filename
    const remotePath = `audio/${file.originalname}`;

    // Upload to Google Drive (will reuse if already exists)
    const audioUrl = await uploadToGoogleDrive(file.path, remotePath);

    // Clean up temporary file
    await fs.remove(file.path);

    res.send({
      success: true,
      url: audioUrl,
      filename: file.originalname
    });
  } catch (err) {
    console.error(err);
    await fs.remove(file.path).catch(() => {});
    res.status(500).send({ error: "Upload failed" });
  }
});

app.post("/upload-video",requireAuth,requireRole(["EDITOR"]), upload.single("file"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send({ error: "No file uploaded" });
  }

  try {
    const ext = path.extname(file.originalname).toLowerCase();
    const videoExts = [".mp4", ".webm", ".ogg", ".mov"];

    if (!videoExts.includes(ext)) {
      await fs.remove(file.path);
      return res.status(400).send({ error: "Only video files (.mp4, .webm, .ogg, .mov) are allowed" });
    }

    // Use original filename
    const remotePath = `videos/${file.originalname}`;

    // Upload to Google Drive (will reuse if already exists)
    const videoUrl = await uploadToGoogleDrive(file.path, remotePath);

    // Clean up temporary file
    await fs.remove(file.path);

    res.send({
      success: true,
      url: videoUrl,
      filename: file.originalname
    });
  } catch (err) {
    console.error(err);
    await fs.remove(file.path).catch(() => {});
    res.status(500).send({ error: "Upload failed" });
  }
});

app.post("/upload-file",requireAuth,requireRole(["EDITOR"]), upload.single("file"), async (req, res) => {
  const file = req.file;
  const duration = Number(req.body.duration || 6);

  if (!file) {
    return res.status(400).send({ error: "No file uploaded" });
  }

  const workDir = `./tmp/${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    await fs.ensureDir(workDir);

    const ext = path.extname(file.originalname).toLowerCase();
    const localPath = path.join(workDir, file.originalname);

    // move uploaded file to work dir
    await fs.move(file.path, localPath);

    const items = [];

    /* ---------- IMAGE ---------- */
    if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
      const hash = hashPdf(localPath);
      const remote = `slides/images/${hash}${ext}`;
      const url = await uploadToGoogleDrive(localPath, remote);

      items.push({
        type: "image",
        url,
        duration,
      });
    } else if (ext === ".pdf") {
      /* ---------- PDF ---------- */
      const pdfName = path.basename(file.originalname, ext);
      const folder = `slides/${pdfName}`;

      let urls = [];

      const info = await googleDrivePathInfo(folder);

      if (info.exists && info.type === "folder") {
        urls = await listGoogleDriveFolder(folder);
      } else {
        const pdfRemotePath = `pdfs/${file.originalname}`;
        const pdfUrl = await uploadToGoogleDrive(localPath, pdfRemotePath);

        const images = await pdfToImages(localPath, workDir);

        const targetFolderId = await createGoogleDriveFolder(folder);

        // Upload images in parallel with concurrency limit of 10
        const limit = pLimit(10);
        const uploadPromises = images.map((imagePath, i) =>
          limit(async () => {
            const fileName = `page_${i + 1}.png`;
            const url = await uploadToGoogleDrive(imagePath, fileName, targetFolderId);
            return url;
          })
        );

        urls = await Promise.all(uploadPromises);
      }

      urls.forEach((url) => {
        items.push({
          type: "image",
          url,
          duration,
        });
      });
    } else {
      return res.status(400).send({ error: "Unsupported file type" });
    }

    res.send({
      success: true,
      items,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Upload failed" });
  } finally {
    // cleanup temp files
    await fs.remove(workDir);
  }
});

// ---------- Load Dashboard State & Start Server ----------
(async () => {
  // Load state BEFORE starting server
  const savedState = await loadDashboardState();
  if (savedState) {
    Object.assign(dashboardState, savedState);
    console.log("✓ Dashboard state restored from backup");
  } else {
    console.log("✓ Using default dashboard state");
  }

  // Start server only after state is loaded
  server.listen(PORT, "0.0.0.0", () => {
    console.log("Backend running on port " + PORT);
  });
})();
