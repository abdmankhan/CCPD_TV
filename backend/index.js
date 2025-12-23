const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dashboardState = require("./dashboardState");
const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("TV connected");
  socket.emit("INIT_STATE", dashboardState);
});

app.post("/update-layout", (req, res) => {
  dashboardState.layout = req.body.layout;
  io.emit("DASHBOARD_UPDATE", dashboardState);
  res.send({ success: true });
});

server.listen(PORT, () => {
  console.log("Backend running on port 5000");
});

app.post("/update-widget", (req, res) => {
  const { widget, data } = req.body;

  console.log("Update widget:", widget, data);

  if (!dashboardState.widgets[widget]) {
    return res.status(400).send({ error: "Invalid widget" });
  }

  dashboardState.widgets[widget] = data;
  io.emit("DASHBOARD_UPDATE", dashboardState);

  res.send({ success: true });
});
