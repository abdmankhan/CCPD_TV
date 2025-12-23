import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

/* =========================
   CORS
   ========================= */
app.use(cors({
  origin: "https://vaibhav8844.github.io",
  methods: ["GET", "POST"]
}));

app.use(express.json());

/* =========================
   SOCKET.IO
   ========================= */
const io = new Server(server, {
  cors: {
    origin: "https://vaibhav8844.github.io",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
});

/* =========================
   API
   ========================= */
app.post("/update-widget", (req, res) => {
  io.emit("DASHBOARD_UPDATE", req.body);
  res.json({ success: true });
});

/* =========================
   START SERVER
   ========================= */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
