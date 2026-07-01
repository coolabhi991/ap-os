import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    application: "AP OS",
    version: "0.0.1",
    message: "API is running successfully",
  });
});

app.use("/api/v1/auth", authRoutes);

export default app;