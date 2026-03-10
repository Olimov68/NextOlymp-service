import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth";
import statsRoutes from "./routes/stats";
import olympiadRoutes from "./routes/olympiads";
import announcementRoutes from "./routes/announcements";
import newsRoutes from "./routes/news";
import resultRoutes from "./routes/results";
import userRoutes from "./routes/users";
import questionRoutes from "./routes/questions";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/olympiads", olympiadRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/users", userRoutes);
app.use("/api/questions", questionRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
