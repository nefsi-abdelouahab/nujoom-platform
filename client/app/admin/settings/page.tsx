"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";

export default function AdminSettingsPage() {
  const { currentUser } = useAuth();
  const { updateJudge } = useAppData();

  const [fullName, setFullName] = useState(currentUser?.fullName || "");
  const [username, setUsername] = useState(currentUser?.username || "");
  const [password, setPassword] = useState(currentUser?.password || "");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!currentUser) {
    return <p className="text-neutral-400">جاري التحميل...</p>;
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setMessage({ type: "error", text: "يرجى تعبئة جميع الحقول" });
      return;
    }

    const result = updateJudge(currentUser!.id, {
      fullName: fullName.trim(),
      username: username.trim(),
      password: password.trim(),
    });

    if (!result.success) {
      setMessage({ type: "error", text: result.error || "حدث خطأ غير متوقع" });
      return;
    }

    setMessage({ type: "success", text: "تم حفظ بيانات الحساب بنجاح" });
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">الإعدادات</h1>
        <p className="text-neutral-400 mt-1">إدارة حساب المدير وحالة النظام</p>
      </div>

      {/* بيانات الحساب */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6 flex flex-col gap-4"
      >
        <h2 className="text-amber-400 font-semibold">بيانات حساب المدير</h2>

        <div>
          <label className="text-xs text-neutral-400 mb-1 block">الاسم الكامل</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">اسم المستخدم</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">كلمة المرور</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          className="self-start rounded-lg bg-gradient-to-l from-amber-500 to-amber-400 px-6 py-2.5 text-sm font-semibold text-neutral-900 transition hover:from-amber-400 hover:to-amber-300"
        >
          حفظ التغييرات
        </button>
      </form>

      {/* حالة النظام */}
      <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6 flex flex-col gap-4">
        <h2 className="text-amber-400 font-semibold">حالة النظام</h2>

        <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm text-sky-300">
          المنصة تعمل حاليًا على بيانات تجريبية (Mock Data) مخزّنة في الذاكرة فقط — لا يوجد
          اتصال بقاعدة بيانات حقيقية بعد. أي تعديل (مشاركون، درجات، محكّمون...) يُفقد عند
          إعادة تحميل الصفحة. سيتم استبدال هذا بـ Backend حقيقي لاحقًا.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 pt-4">
          <div>
            <p className="text-sm text-neutral-200">إعادة تعيين الجلسة الحالية</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              يعيد تحميل الصفحة ويُرجع كل البيانات التجريبية إلى حالتها الافتراضية
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:border-red-500/40 hover:text-red-400"
          >
            إعادة تعيين
          </button>
        </div>
      </div>

      {/* حول المنصة */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="text-neutral-300 font-semibold mb-3">حول المنصة</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-neutral-500">الواجهة</dt>
          <dd className="text-neutral-300">Next.js (App Router) + TypeScript + Tailwind CSS v4</dd>
          <dt className="text-neutral-500">مصدر البيانات</dt>
          <dd className="text-neutral-300">Mock Data (React Context) — بدون Backend بعد</dd>
          <dt className="text-neutral-500">استيراد المشاركين</dt>
          <dd className="text-neutral-300">CSV عبر papaparse</dd>
        </dl>
      </div>
    </div>
  );
}
