"use client";

import { useState } from "react";
import { useAppData } from "@/context/AppDataContext";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import type { DeleteResult } from "@/context/AppDataContext";
import type { Committee } from "@/types";

// ---- Modal تعديل اللجنة ----
function EditCommitteeModal({
  committee,
  onSave,
  onClose,
}: {
  committee: Committee;
  onSave: (id: string, data: Partial<Omit<Committee, "id">>) => void;
  onClose: () => void;
}) {
  const { phases, circles, users } = useAppData();
  const [name, setName] = useState(committee.name);
  const [phaseId, setPhaseId] = useState(committee.phaseId);
  const [circleId, setCircleId] = useState(committee.circleId || "");
  const [headUserId, setHeadUserId] = useState(committee.headUserId || "");

  const headCandidates = users.filter((u) => u.role === "head" || u.role === "admin");
  const phaseCircles = circles.filter((c) => c.phaseId === phaseId);

  function handleSave() {
    if (!name.trim()) return;
    onSave(committee.id, {
      name: name.trim(),
      phaseId,
      circleId: circleId || undefined,
      headUserId: headUserId || undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-amber-500/20 bg-neutral-900 p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-amber-400 mb-5">تعديل اللجنة</h3>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">اسم اللجنة</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400 mb-1 block">المرحلة</label>
            <select
              value={phaseId}
              onChange={(e) => { setPhaseId(e.target.value); setCircleId(""); }}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
            >
              {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {phaseCircles.length > 0 && (
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">الدائرة (اختياري)</label>
              <select
                value={circleId}
                onChange={(e) => setCircleId(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
              >
                <option value="">— بدون دائرة —</option>
                {phaseCircles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-neutral-400 mb-1 block">رئيس اللجنة</label>
            <select
              value={headUserId}
              onChange={(e) => setHeadUserId(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
            >
              <option value="">— غير محدد —</option>
              {headCandidates.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-lg border border-neutral-700 py-2.5 text-sm text-neutral-400 hover:bg-neutral-800">إلغاء</button>
          <button onClick={handleSave} className="flex-1 rounded-lg bg-amber-400 py-2.5 text-sm font-bold text-neutral-900 hover:bg-amber-300">حفظ</button>
        </div>
      </div>
    </div>
  );
}

// ---- Modal إضافة لجنة ----
function AddCommitteeModal({ onClose }: { onClose: () => void }) {
  const { phases, circles, users, addCommittee } = useAppData();
  const [name, setName] = useState("");
  const [phaseId, setPhaseId] = useState(phases[0]?.id || "");
  const [circleId, setCircleId] = useState("");
  const [headUserId, setHeadUserId] = useState("");

  const headCandidates = users.filter((u) => u.role === "head");
  const phaseCircles = circles.filter((c) => c.phaseId === phaseId);

  function handleAdd() {
    if (!name.trim() || !phaseId) return;
    addCommittee({
      name: name.trim(),
      phaseId,
      circleId: circleId || undefined,
      headUserId: headUserId || undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-amber-500/20 bg-neutral-900 p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-amber-400 mb-5">إضافة لجنة جديدة</h3>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">اسم اللجنة *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: لجنة الدائرة الشرقية"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400 mb-1 block">المرحلة *</label>
            <select
              value={phaseId}
              onChange={(e) => { setPhaseId(e.target.value); setCircleId(""); }}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
            >
              {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {phaseCircles.length > 0 && (
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">الدائرة (للتصفيات)</label>
              <select
                value={circleId}
                onChange={(e) => setCircleId(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
              >
                <option value="">— بدون دائرة —</option>
                {phaseCircles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-neutral-400 mb-1 block">رئيس اللجنة</label>
            <select
              value={headUserId}
              onChange={(e) => setHeadUserId(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
            >
              <option value="">— يحدد لاحقًا —</option>
              {headCandidates.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-lg border border-neutral-700 py-2.5 text-sm text-neutral-400 hover:bg-neutral-800">إلغاء</button>
          <button onClick={handleAdd} disabled={!name.trim()} className="flex-1 rounded-lg bg-amber-400 py-2.5 text-sm font-bold text-neutral-900 hover:bg-amber-300 disabled:opacity-40">إضافة</button>
        </div>
      </div>
    </div>
  );
}

export default function CommitteesPage() {
  const { committees, phases, circles, users, updateCommittee, deleteCommittee } = useAppData();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Committee | null>(null);
  const [pending, setPending] = useState<(DeleteResult & { name: string }) | null>(null);

  function handleDelete(committee: Committee) {
    const result = deleteCommittee(committee.id);
    if (result.success) return;
    setPending({ ...result, name: committee.name });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">اللجان</h1>
          <p className="text-neutral-400 mt-1">إجمالي {committees.length} لجان — كل لجنة تحكّم جميع الفئات</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="rounded-lg bg-gradient-to-l from-amber-500 to-amber-400 px-5 py-2 font-semibold text-neutral-900 transition hover:from-amber-400 hover:to-amber-300 whitespace-nowrap"
        >
          + إضافة لجنة
        </button>
      </div>

      {phases.map((phase) => {
        const phaseCommittees = committees.filter((c) => c.phaseId === phase.id);
        if (phaseCommittees.length === 0) return null;
        return (
          <div key={phase.id} className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
            <h2 className="text-amber-400 font-semibold mb-4">{phase.name}</h2>
            <div className="flex flex-col gap-3">
              {phaseCommittees.map((committee) => {
                const circle = circles.find((c) => c.id === committee.circleId);
                const head = users.find((u) => u.id === committee.headUserId);
                return (
                  <div key={committee.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-800 px-4 py-3 transition hover:border-neutral-700">
                    <div className="flex-1 min-w-0">
                      <p className="text-neutral-100 font-medium truncate">{committee.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {circle && <span className="text-xs text-neutral-500">{circle.name}</span>}
                        <span className="text-xs text-neutral-400">
                          رئيس: {head?.fullName || <span className="text-amber-500/70">غير محدد</span>}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditTarget(committee)}
                      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-amber-400/50 hover:text-amber-400"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(committee)}
                      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-red-500/50 hover:text-red-400"
                    >
                      حذف
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {committees.length === 0 && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-neutral-500">
          لا توجد لجان بعد — اضغط «إضافة لجنة» للبدء
        </div>
      )}

      {addOpen && <AddCommitteeModal onClose={() => setAddOpen(false)} />}
      {editTarget && (
        <EditCommitteeModal
          committee={editTarget}
          onSave={updateCommittee}
          onClose={() => setEditTarget(null)}
        />
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