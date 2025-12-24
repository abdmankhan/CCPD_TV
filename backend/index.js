import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Backend alive");
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT,"0.0.0.0", () => {
  console.log("Backend running on port", PORT);
});
