import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();

    const app = createApp();

    app.listen(PORT, () => {
      console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
      console.log(`   فحص الحالة: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error("❌ فشل تشغيل الخادم:", err);
    process.exit(1);
  }
}

bootstrap();
