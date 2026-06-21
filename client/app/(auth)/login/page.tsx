"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";

export default function LoginPage() {
  const { login, currentUser, selectCommittee } = useAuth();
  const { committees } = useAppData();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = login(username, password);
    if (!result.success) {
      setError(result.error || "حدث خطأ");
    }
  }

  // حالة: المستخدم سجّل دخول لكنه لديه أكثر من لجنة → يجب أن يختار
  const needsCommitteeSelection =
    currentUser &&
    currentUser.role !== "admin" &&
    currentUser.committeeIds.length > 1;

  if (needsCommitteeSelection) {
    const myCommittees = committees.filter((c) =>
      currentUser!.committeeIds.includes(c.id)
    );

    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-neutral-900/60 backdrop-blur-xl p-8 shadow-[0_0_40px_-10px_rgba(212,175,55,0.3)]">
          <h1 className="text-xl font-bold text-amber-400 text-center mb-2">
            اختر اللجنة
          </h1>
          <p className="text-sm text-neutral-400 text-center mb-6">
            أنت مكلّف بأكثر من لجنة، اختر اللجنة التي تريد العمل ضمنها
          </p>

          <div className="flex flex-col gap-3">
            {myCommittees.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCommittee(c.id)}
                className="w-full rounded-xl border border-amber-500/30 bg-neutral-800/80 px-4 py-3 text-right text-neutral-100 transition hover:border-amber-400 hover:bg-neutral-800 hover:shadow-[0_0_20px_-5px_rgba(212,175,55,0.5)]"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-neutral-900/60 backdrop-blur-xl p-8 shadow-[0_0_40px_-10px_rgba(212,175,55,0.3)]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-amber-400 mb-1">
            نجوم القراءة
          </h1>
          <p className="text-sm text-neutral-400">
            منصة إدارة وتحكيم المسابقة
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-neutral-300 mb-1.5">
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
              placeholder="ادخل اسم المستخدم"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1.5">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-neutral-100 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-gradient-to-l from-amber-500 to-amber-400 px-4 py-2.5 font-semibold text-neutral-900 transition hover:from-amber-400 hover:to-amber-300 hover:shadow-[0_0_25px_-5px_rgba(212,175,55,0.7)]"
          >
            تسجيل الدخول
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-500">
          للتجربة: admin / admin123 — head1 / 123456 — judge1 / 123456
        </p>
      </div>
    </main>
  );
}