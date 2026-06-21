"use client";

import { useState } from "react";
import { useAppData } from "@/context/AppDataContext";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import type { DeleteResult } from "@/context/AppDataContext";

// ---- سطر دائرة قابل للتعديل ----
function CircleRow({
  id,
  name,
  phaseId,
  phases,
  onSave,
  onDelete,
}: {
  id: string;
  name: string;
  phaseId: string;
  phases: { id: string; name: string }[];
  onSave: (id: string, name: string, phaseId: string) => void;
  onDelete: (id: string) => DeleteResult;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editPhaseId, setEditPhaseId] = useState(phaseId);
  const [pending, setPending] = useState<DeleteResult | null>(null);

  const currentPhaseName = phases.find((p) => p.id === phaseId)?.name ?? "—";

  function handleSave() {
    if (!editName.trim()) return;
    onSave(id, editName.trim(), editPhaseId);
    setEditing(false);
  }

  function handleDelete() {
    const result = onDelete(id);
    if (result.success) return;
    setPending(result);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-800 px-4 py-3 transition hover:border-neutral-700">
        {editing ? (
          <>
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
              className="flex-1 min-w-[120px] rounded-lg border border-amber-400/50 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-amber-400"
            />
            <select
              value={editPhaseId}
              onChange={(e) => setEditPhaseId(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-amber-400"
            >
              {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={handleSave} className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-neutral-900">حفظ</button>
            <button onClick={() => { setEditName(name); setEditPhaseId(phaseId); setEditing(false); }} className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400">إلغاء</button>
          </>
        ) : (
          <>
            <span className="flex-1 text-neutral-100">{name}</span>
            <span className="text-xs text-neutral-500 bg-neutral-800 rounded-full px-2 py-0.5">{currentPhaseName}</span>
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-amber-400/50 hover:text-amber-400"
            >
              تعديل
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-red-500/50 hover:text-red-400"
            >
              حذف
            </button>
          </>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={!!pending}
        itemName={name}
        relatedSummary={pending?.relatedSummary}
        onCancel={() => setPending(null)}
        onConfirm={() => { pending?.confirm?.(); setPending(null); }}
      />
    </>
  );
}

export default function CirclesPage() {
  const { circles, phases, addCircle, updateCircle, deleteCircle } = useAppData();

  const [newCircleName, setNewCircleName] = useState("");
  const [selectedPhaseId, setSelectedPhaseId] = useState(phases[0]?.id || "");

  function handleAddCircle() {
    if (!newCircleName.trim() || !selectedPhaseId) return;
    addCircle(newCircleName.trim(), selectedPhaseId);
    setNewCircleName("");
  }

  // تجميع الدوائر حسب المرحلة
  const byPhase = phases.map((phase) => ({
    phase,
    items: circles.filter((c) => c.phaseId === phase.id),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">الدوائر والمراكز</h1>
        <p className="text-neutral-400 mt-1">الدوائر الجغرافية في التصفيات، والمراكز في نصف النهائي والنهائي</p>
      </div>

      {/* عرض حسب المرحلة */}
      {byPhase.map(({ phase, items }) => {
        if (items.length === 0) return null;
        return (
          <div key={phase.id} className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
            <h2 className="text-amber-400 font-semibold mb-4">{phase.name}</h2>
            <div className="flex flex-col gap-2">
              {items.map((circle) => (
                <CircleRow
                  key={circle.id}
                  id={circle.id}
                  name={circle.name}
                  phaseId={circle.phaseId}
                  phases={phases}
                  onSave={updateCircle}
                  onDelete={deleteCircle}
                />
              ))}
            </div>
          </div>
        );
      })}

      {circles.length === 0 && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-neutral-500">
          لا توجد دوائر/مراكز بعد — أضف أول واحدة أدناه
        </div>
      )}

      {/* نموذج الإضافة */}
      <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
        <h2 className="text-amber-400 font-semibold mb-4">إضافة دائرة / مركز جديد</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedPhaseId}
            onChange={(e) => setSelectedPhaseId(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-neutral-100 outline-none focus:border-amber-400"
          >
            {phases.map((phase) => (
              <option key={phase.id} value={phase.id}>{phase.name}</option>
            ))}
          </select>

          <input
            type="text"
            value={newCircleName}
            onChange={(e) => setNewCircleName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCircle()}
            placeholder="اسم الدائرة / المركز"
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-neutral-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
          />

          <button
            onClick={handleAddCircle}
            className="rounded-lg bg-gradient-to-l from-amber-500 to-amber-400 px-5 py-2 font-semibold text-neutral-900 transition hover:from-amber-400 hover:to-amber-300 whitespace-nowrap"
          >
            إضافة
          </button>
        </div>
      </div>
    </div>
  );
}