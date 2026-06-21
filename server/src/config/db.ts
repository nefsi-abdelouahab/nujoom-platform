import mongoose from "mongoose";

/**
 * يتصل بقاعدة بيانات MongoDB باستخدام رابط الاتصال من متغيرات البيئة.
 * يُستدعى مرة واحدة عند إقلاع الخادم (راجع server.ts).
 */
export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI غير معرّف — تأكد من وجود ملف .env يحتوي على رابط الاتصال (راجع .env.example)"
    );
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);

  console.log(`✅ تم الاتصال بقاعدة البيانات: ${mongoose.connection.name}`);
}

mongoose.connection.on("error", (err) => {
  console.error("❌ خطأ في اتصال MongoDB:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  انقطع الاتصال بقاعدة البيانات");
});
