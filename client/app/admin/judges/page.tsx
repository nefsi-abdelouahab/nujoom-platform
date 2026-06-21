"use client";

import { useState } from "react";
import { useAppData } from "@/context/AppDataContext";
import { getAssignmentsForCommittee } from "@/lib/utils";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import type { DeleteResult } from "@/context/AppDataContext";
import type { User } from "@/types";

// ---- Modal تعديل محكّم ----
function EditJudgeModal({
  judge,
  onClose,
}: {
  judge: User;
  onClose: () => void;
}) {
  const { committees, updateJudge } = useAppData();
  const [fullName, setFullName] = useState(judge.fullName);
  const [username, setUsername] = useState(judge.username);
  const [password, setPassword] = useState(judge.password);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setError("كل الحقول مطلوبة");
      return;
    }
    const result = updateJudge(judge.id, {
      fullName: fullName.trim(),
      username: username.trim(),
      password: password.trim(),
    });
    if (!result.success) { setError(result.error || "حدث خطأ"); return; }
    onClose();
  }

  const judgeCommittees = committees.filter((c) => judge.committeeIds.includes(c.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-amber-500/20 bg-neutral-900 p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-amber-400 mb-1">تعديل المحكّم</h3>
        {judgeCommittees.length > 0 && (
          <p className="text-xs text-neutral-500 mb-5">
            لجنة: {judgeCommittees.map((c) => c.name).join("، ")}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">الاسم الكامل</label>
            <input
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
            />
          </div>
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-lg border border-neutral-700 py-2.5 text-sm text-neutral-400 hover:bg-neutral-800">إلغاء</button>
          <button onClick={handleSave} className="flex-1 rounded-lg bg-amber-400 py-2.5 text-sm font-bold text-neutral-900 hover:bg-amber-300">حفظ</button>
        </div>
      </div>
    </div>
  );
}

// ---- نموذج إضافة محكّم ----
function AddJudgeForm() {
  const { committees, criteria, addJudge, addCommitteeCriterionAssignment } = useAppData();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [committeeId, setCommitteeId] = useState("");
  const [criterionId, setCriterionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function reset() {
    setFullName(""); setUsername(""); setPassword("");
    setCommitteeId(""); setCriterionId("");
  }

  function handleAdd() {
    setError(null); setSuccess(null);
    if (!fullName.trim() || !username.trim() || !password.trim() || !committeeId || !criterionId) {
      setError("يرجى تعبئة كل الحقول"); return;
    }

    const judgeResult = addJudge({
      username: username.trim(), password: password.trim(),
      fullName: fullName.trim(), role: "judge",
      committeeIds: [committeeId], criterionId,
    });
    if (!judgeResult.success || !judgeResult.user) { setError(judgeResult.error || "خطأ غير متوقع"); return; }

    const assignResult = addCommitteeCriterionAssignment(committeeId, criterionId, judgeResult.user.id);
    if (!assignResult.success) { setError(assignResult.error || "خطأ في التعيين"); return; }

    setSuccess(`تمت إضافة «${judgeResult.user.fullName}» بنجاح`);
    reset();
  }

  return (
    <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
      <h2 className="text-amber-400 font-semibold mb-4">إضافة محكّم جديد</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="الاسم الكامل"
          className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-amber-400" />
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="اسم المستخدم"
          className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-amber-400" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" type="text"
          className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-amber-400" />
        <select value={committeeId} onChange={(e) => { setCommitteeId(e.target.value); setCriterionId(""); }}
          className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-amber-400">
          <option value="">اختر اللجنة</option>
          {committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={criterionId} onChange={(e) => setCriterionId(e.target.value)} disabled={!committeeId}
          className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-amber-400 disabled:opacity-40 sm:col-span-2">
          <option value="">{committeeId ? "اختر المعيار" : "اختر اللجنة أولًا"}</option>
          {criteria.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
      {success && <p className="text-xs text-emerald-400 mt-3">{success}</p>}

      <button onClick={handleAdd}
        className="mt-4 rounded-lg bg-gradient-to-l from-amber-500 to-amber-400 px-5 py-2 font-semibold text-neutral-900 transition hover:from-amber-400 hover:to-amber-300">
        إضافة المحكّم
      </button>
    </div>
  );
}

export default function JudgesPage() {
  const { committees, users, criteria, assignments, deleteJudge, deleteAssignment } = useAppData();

  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [pending, setPending] = useState<(DeleteResult & { name: string }) | null>(null);

  function handleDeleteJudge(user: User) {
    const result = deleteJudge(user.id);
    if (result.success) return;
    setPending({ ...result, name: user.fullName });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">المحكّمون</h1>
        <p className="text-neutral-400 mt-1">
          كل لجنة تضم عدة محكّمين — يمكن لأكثر من محكّم تحكيم نفس المعيار (لتسريع العمل عند كثرة المشاركين)
        </p>
      </div>

      <AddJudgeForm />

      {committees.map((committee) => {
        const committeeAssignments = getAssignmentsForCommittee(committee.id, assignments, criteria, users);
        const head = users.find((u) => u.id === committee.headUserId);

        return (
          <div key={committee.id} className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-amber-400 font-semibold">{committee.name}</h2>
              {head && <span className="text-xs text-neutral-500">رئيس اللجنة: {head.fullName}</span>}
            </div>

            {committeeAssignments.length === 0 ? (
              <p className="text-sm text-neutral-500 py-2">لم يتم تعيين محكّمين لهذه اللجنة بعد</p>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="border-b border-neutral-800 text-right">
                      <th className="py-2 px-3 text-neutral-400 font-medium">المعيار</th>
                      <th className="py-2 px-3 text-neutral-400 font-medium">المحكّم</th>
                      <th className="py-2 px-3 text-neutral-400 font-medium">الدور</th>
                      <th className="py-2 px-3 text-neutral-400 font-medium w-24">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {committeeAssignments.map((a) => {
                      const judge = a.judge;
                      return (
                        <tr key={a.id} className="border-b border-neutral-800/60 hover:bg-neutral-800/30">
                          <td className="py-2.5 px-3 text-neutral-100">{a.criterion?.name}</td>
                          <td className="py-2.5 px-3 text-neutral-300">{judge?.fullName}</td>
                          <td className="py-2.5 px-3">
                            <span className={`text-xs rounded-full px-2.5 py-1 ${
                              judge?.role === "head"
                                ? "bg-amber-500/15 text-amber-300"
                                : "bg-neutral-800 text-neutral-400"
                            }`}>
                              {judge?.role === "head" ? "رئيس اللجنة" : "محكّم"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex gap-1">
                              {judge && (
                                <button
                                  onClick={() => setEditTarget(judge)}
                                  className="rounded px-2 py-1 text-xs text-neutral-400 hover:text-amber-400 hover:bg-neutral-800"
                                  title="تعديل المحكّم"
                                >
                                  ✏️
                                </button>
                              )}
                              <button
                                onClick={() => deleteAssignment(a.id)}
                                className="rounded px-2 py-1 text-xs text-neutral-400 hover:text-orange-400 hover:bg-neutral-800"
                                title="إلغاء التعيين فقط"
                              >
                                🔗
                              </button>
                              {judge && judge.role !== "head" && (
                                <button
                                  onClick={() => handleDeleteJudge(judge)}
                                  className="rounded px-2 py-1 text-xs text-neutral-400 hover:text-red-400 hover:bg-neutral-800"
                                  title="حذف المحكّم نهائيًا"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {(() => {
              const coveredCriteriaIds = new Set(committeeAssignments.map((a) => a.criterionId));
              const uncovered = criteria.filter((c) => !coveredCriteriaIds.has(c.id));
              if (uncovered.length === 0) return null;
              return (
                <p className="text-xs text-amber-500 mt-3">
                  تنبيه: المعايير التالية بدون أي محكّم في هذه اللجنة: {uncovered.map((c) => c.name).join("، ")}
                </p>
              );
            })()}
          </div>
        );
      })}

      {editTarget && (
        <EditJudgeModal judge={editTarget} onClose={() => setEditTarget(null)} />
      )}

      <ConfirmDeleteModal
        isOpen={!!pending}
        itemName={pending?.name || ""}
        relatedSummary={pending?.relatedSummary}
        onCancel={() => setPending(null)}
        onConfirm={() => { pending?.confirm?.(); setPending(null); }}
      />
    </div>
  );
}