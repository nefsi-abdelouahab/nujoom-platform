import express, { Application, Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import headRoutes from "./routes/headRoutes";
import judgeRoutes from "./routes/judgeRoutes";

export function createApp(): Application {
  const app = express();

  // ---- Middleware عام ----
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
      credentials: true,
    }),
  );
  app.use(express.json());

  // ---- مسار فحص الحالة (للتأكد أن الخادم يعمل) ----
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", service: "nujoom-platform-server" });
  });

  // ---- مسارات الموارد الفعلية تُضاف هنا تباعًا في الخطوات القادمة ----
  // مثال لاحقًا: app.use("/api/auth", authRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/head", headRoutes);
  app.use("/api/judge", judgeRoutes);
  // ---- معالج 404 لأي مسار غير معروف ----
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "المسار غير موجود" });
  });

  return app;
}
