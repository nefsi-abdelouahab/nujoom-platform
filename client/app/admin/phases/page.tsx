"use client";

import { useState } from "react";
import { useAppData } from "@/context/AppDataContext";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import type { DeleteResult } from "@/context/AppDataContext";

// ---- مكوّن سطر قابل للتعديل ----
function EditableRow({
  id,
  label,
  sublabel,
  onSave,
  onDelete,
}: {
  id: string;
  label: string;
  sublabel?: string;
  onSave: (id: string, val: string) => void;
  onDelete: (id: string) => DeleteResult;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(label);
  const [pending, setPending] = useState<DeleteResult | null>(null);

  function handleSave() {
    if (!val.trim()) return;
    onSave(id, val.trim());
    setEditing(false);
  }

  function handleDelete() {
    const result = onDelete(id);
    if (result.success) return; // حُذف مباشرة
    setPending(result); // يحتاج تأكيد
  }

  return (
    <>
      <div className="flex items-center gap-2 rounded-xl border border-neutral-800 px-4 py-3 transition hover:border-neutral-700">
        {editing ? (
          <>
            <input
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
              className="flex-1 rounded-lg border border-amber-400/50 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-amber-400"
            />
            <button onClick={handleSave} className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-neutral-900">حفظ</button>
            <button onClick={() => { setVal(label); setEditing(false); }} className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400">إلغاء</button>
          </>
        ) : (
          <>
            <span className="flex-1 text-neutral-100">{label}</span>
            {sublabel && <span className="text-xs text-neutral-500">{sublabel}</span>}
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
        itemName={label}
        relatedSummary={pending?.relatedSummary}
        onCancel={() => setPending(null)}
        onConfirm={() => { pending?.confirm?.(); setPending(null); }}
      />
    </>
  );
}

export default function PhasesPage() {
  const {
    phases, categories,
    addPhase, updatePhase, deletePhase,
    addCategory, updateCategory, deleteCategory,
  } = useAppData();

  const [newPhaseName, setNewPhaseName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  function handleAddPhase() {
    if (!newPhaseName.trim()) return;
    addPhase(newPhaseName.trim());
    setNewPhaseName("");
  }

  function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName("");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">المراحل والفئات</h1>
        <p className="text-neutral-400 mt-1">إدارة مراحل المسابقة والفئات العمرية</p>
      </div>

      {/* ======= المراحل ======= */}
      <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
        <h2 className="text-amber-400 font-semibold mb-4">المراحل</h2>

        <div className="flex flex-col gap-2 mb-4">
          {phases.length === 0 && (
            <p className="text-sm text-neutral-500 py-2 text-center">لا توجد مراحل بعد</p>
          )}
          {phases
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((phase) => (
              <EditableRow
                key={phase.id}
                id={phase.id}
                label={phase.name}
                sublabel={`ترتيب ${phase.order}`}
                onSave={(id, val) => updatePhase(id, val)}
                onDelete={deletePhase}
              />
            ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newPhaseName}
            onChange={(e) => setNewPhaseName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddPhase()}
            placeholder="اسم المرحلة الجديدة"
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-neutral-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
          />
          <button
            onClick={handleAddPhase}
            className="rounded-lg bg-gradient-to-l from-amber-500 to-amber-400 px-5 py-2 font-semibold text-neutral-900 transition hover:from-amber-400 hover:to-amber-300"
          >
            إضافة
          </button>
        </div>
      </div>

      {/* ======= الفئات ======= */}
      <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
        <h2 className="text-amber-400 font-semibold mb-4">الفئات العمرية</h2>

        <div className="flex flex-col gap-2 mb-4">
          {categories.length === 0 && (
            <p className="text-sm text-neutral-500 py-2 text-center">لا توجد فئات بعد</p>
          )}
          {categories
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((cat) => (
              <EditableRow
                key={cat.id}
                id={cat.id}
                label={cat.name}
                sublabel={`ترتيب ${cat.order}`}
                onSave={(id, val) => updateCategory(id, val)}
                onDelete={deleteCategory}
              />
            ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            placeholder="اسم الفئة الجديدة"
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-neutral-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
          />
          <button
            onClick={handleAddCategory}
            className="rounded-lg bg-gradient-to-l from-amber-500 to-amber-400 px-5 py-2 font-semibold text-neutral-900 transition hover:from-amber-400 hover:to-amber-300"
          >
            إضافة
          </button>
        </div>
      </div>
    </div>
  );
}