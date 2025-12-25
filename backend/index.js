import "dotenv/config";

import { hashPdf } from "./utils/hashPdf.js";
import { pdfToImages } from "./utils/pdfToImages.js";
import { uploadImageToGithub } from "./utils/uploadImageToGithub.js";
import { githubPathInfo } from "./utils/githubPathInfo.js";
import { listGithubFolder } from "./utils/listGithubFolder.js";
import { requireAuth } from "./middleware/auth.middleware.js";
import { requireRole } from "./middleware/role.middleware.js";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs-extra";
import multer from "multer";
import path from "path";

import dashboardState from "./dashboardState.js";
import authRoutes from "./routes/auth.routes.js";
import tvRoutes from "./routes/tv.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ dest: "./tmp/uploads" });

app.use(cors());
app.use(express.json());

app.use(authRoutes);
app.use(tvRoutes);

// ---------- Startup tmp cleanup (recommended) ----------
await fs.ensureDir("./tmp");

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ---------- Socket ----------
io.on("connection", (socket) => {
  console.log("TV connected");
  socket.emit("INIT_STATE", dashboardState);
});

// ---------- APIs ----------
app.get("/dashboard-state",requireAuth,requireRole(["EDITOR", "VIEWER"]), (req, res) => {
  res.json(dashboardState);
});

app.post("/update-layout",requireAuth,requireRole(["EDITOR"]), (req, res) => {
  dashboardState.layout = req.body.layout;
  io.emit("DASHBOARD_UPDATE", dashboardState);
  res.send({ success: true });
});

app.post("/update-widget",requireAuth, (req, res) => {
  const { widget, data } = req.body;

  if (!dashboardState.widgets[widget]) {
    return res.status(400).send({ error: "Invalid widget" });
  }

  dashboardState.widgets[widget] = data;
  // io.emit("DASHBOARD_UPDATE", dashboardState);

  res.send({ success: true });
});

app.post("/clear-widgets",requireAuth,requireRole(["EDITOR"]), (req, res) => {
  // Object.keys(dashboardState.widgets).forEach(key => {
  //   dashboardState.widgets[key] = [];
  // });
  dashboardState.layout = [];
  io.emit("DASHBOARD_UPDATE", dashboardState);
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

          const info = await githubPathInfo(folder);
          if (info.exists && info.type === "folder") {
            imageUrls = await listGithubFolder(folder);
          } else {
            const images = await pdfToImages(pdfPath, workDir);

            for (let i = 0; i < images.length; i++) {
              const remote = `${folder}/page_${i + 1}.png`;
              const url = await uploadImageToGithub(images[i], remote);
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

    res.send({ success: true, slides: finalSlides.length });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to update playlist" });
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
      const url = await uploadImageToGithub(localPath, remote);

      items.push({
        type: "image",
        url,
        duration,
      });
    } else if (ext === ".pdf") {
      /* ---------- PDF ---------- */
      const hash = hashPdf(localPath);
      const folder = `slides/${hash}`;

      let urls = [];

      const info = await githubPathInfo(folder);

      if (info.exists && info.type === "folder") {
        urls = await listGithubFolder(folder);
      } else {
        const images = await pdfToImages(localPath, workDir);

        for (let i = 0; i < images.length; i++) {
          const remote = `${folder}/page_${i + 1}.png`;
          urls.push(await uploadImageToGithub(images[i], remote));
        }
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

// ---------- Start Server ----------
server.listen(PORT, "0.0.0.0", () => {
  console.log("Backend running on port " + PORT);
});
