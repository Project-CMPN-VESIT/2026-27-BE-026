import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import translateRouter from "./routes/translate.routes.js";
import ragRouter from "./routes/rag.routes.js";
import glossaryRouter from "./routes/glossary.routes.js";
import documentRouter from "./routes/document.routes.js";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));
app.use(express.json({ limit: "100kb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please try again shortly."
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "TechMorph API is running." });
});

app.use("/api/translate", limiter, translateRouter);
app.use("/api/rag", limiter, ragRouter);
app.use("/api/glossary", limiter, glossaryRouter);
app.use("/api/documents", limiter, documentRouter);

app.use((err, _req, res, _next) => {
  console.error("Server error:", err?.message || err);
  res.status(500).json({
    success: false,
    error: "Something went wrong on the server."
  });
});

export default app;
