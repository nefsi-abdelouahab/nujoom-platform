"use client";

import { useState } from "react";
import { useAppData } from "@/context/AppDataContext";
import { useScores } from "@/context/ScoresContext";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import type { DeleteResult } from "@/context/AppDataContext";
import type { Indicator } from "@/types";

// ---- سطر مؤشر قابل للتعديل ----
function IndicatorRow({
  criterionId,
  indicator,
  onSave,
  onDelete,
}: {
  criterionId: string;
  indicator: Indicator;
  onSave: (criterionId: string, indicatorId: string, name: string, maxScore: number) => void;
  onDelete: (criterionId: string, indicatorId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(indicator.name);
  const [maxScore, setMaxScore] = useState(indicator.maxScore.toString());
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleSave() {
    const parsed = parseFloat(maxScore);
    if (!name.trim() || isNaN(parsed) || parsed <= 0) return;
    onSave(criterionId, indicator.id, name.trim(), parsed);
    setEditing(false);
  }

  function handleCancel() {
    setName(indicator.name);
    setMaxScore(indicator.maxScore.toString());
    setEditing(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-800 px-4 py-2.5">
        {editing ? (
          <>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
              className="flex-1 min-w-[120px] rounded-lg border border-amber-400/50 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-amber-400"
            />
            <input
              type="number"
              min={0}
              step="0.5"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
              className="w-24 rounded-lg border border-amber-400/50 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-amber-400"
            />
            <button onClick={handleSave} className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-neutral-900">حفظ</button>
            <button onClick={handleCancel} className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400">إلغاء</button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm text-neutral-200">{indicator.name}</span>
            <span className="text-xs text-amber-300">{indicator.maxScore} نقطة</span>
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-amber-400/50 hover:text-amber-400"
            >
              تعديل
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-red-500/50 hover:text-red-400"
            >
              حذف
            </button>
          </>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={confirmOpen}
        itemName={indicator.name}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { onDelete(criterionId, indicator.id); setConfirmOpen(false); }}
      />
    </>
  );
}

export default function CriteriaPage() {
  const { criteria, assignments, addCriterion, updateCriterion, deleteCriterion, addIndicator, updateIndicator, deleteIndicator } = useAppData();
  const { getScoresCountForCriterion, deleteScoresForCriterion } = useScores();

  const [newCriterionName, setNewCriterionName] = useState("");
  const [indicatorDrafts, setIndicatorDrafts] = useState<Record<string, { name: string; maxScore: string }>>({});
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
  const [editCriterionName, setEditCriterionName] = useState("");
  const [pending, setPending] = useState<(DeleteResult & { name: string }) | null>(null);

  function handleAddCriterion() {
    if (!newCriterionName.trim()) return;
    addCriterion(newCriterionName.trim());
    setNewCriterionName("");
  }

  function handleAddIndicator(criterionId: string) {
    const draft = indicatorDrafts[criterionId];
    if (!draft?.name?.trim()) return;
    const parsed = parseFloat(draft.maxScore || "1");
    addIndicator(criterionId, draft.name.trim(), isNaN(parsed) || parsed <= 0 ? 1 : parsed);
    setIndicatorDrafts((prev) => ({ ...prev, [criterionId]: { name: "", maxScore: "1" } }));
  }

  function startEditCriterion(id: string, currentName: string) {
    setEditingCriterionId(id);
    setEditCriterionName(currentName);
  }

  function saveEditCriterion() {
    if (!editingCriterionId || !editCriterionName.trim()) return;
    updateCriterion(editingCriterionId, editCriterionName.trim());
    setEditingCriterionId(null);
  }

  function handleDeleteCriterion(criterionId: string, criterionName: string) {
    const relatedScores = getScoresCountForCriterion(criterionId);

    if (relatedScores === 0) {
      // لا توجد درجات مرتبطة — اترك deleteCriterion يتولى فحص المؤشرات/التعيينات وتنفيذ الحذف أو طلب التأكيد
      const result = deleteCriterion(criterionId);
      if (result.success) return; // حُذف مباشرة (لا توجد بيانات مرتبطة إطلاقًا)
      setPending({ ...result, name: criterionName });
      return;
    }

    // توجد درجات مرتبطة — نحسب بقية البيانات المرتبطة يدويًا قبل أي تنفيذ
    const criterion = criteria.find((c) => c.id === criterionId);
    const indicatorCount = criterion?.indicators.length ?? 0;
    const relatedAssignmentsCount = assignments.filter((a) => a.criterionId === criterionId).length;

    const parts: string[] = [];
    if (indicatorCount > 0) parts.push(`${indicatorCount} مؤشر`);
    if (relatedAssignmentsCount > 0) parts.push(`${relatedAssignmentsCount} تعيين محكّم`);
    parts.push(`${relatedScores} درجة مُدخلة`);

    setPending({
      success: false,
      relatedSummary: parts.join(" و "),
      confirm: () => {
        deleteScoresForCriterion(criterionId);
        const result = deleteCriterion(criterionId);
        // إن بقيت مؤشرات/تعيينات مرتبطة، نُتمّ الحذف الشامل عبر confirm() الخاص بها فورًا
        if (!result.success) result.confirm?.();
      },
      name: criterionName,
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">المعايير والمؤشرات</h1>
        <p className="text-neutral-400 mt-1">
          كل معيار يتكوّن من عدة مؤشرات، وكل معيار يحكّمه محكّم واحد في كل لجنة
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {criteria.map((criterion) => {
          const totalMax = criterion.indicators.reduce((sum, i) => sum + i.maxScore, 0);
          const draft = indicatorDrafts[criterion.id] || { name: "", maxScore: "1" };

          return (
            <div
              key={criterion.id}
              className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6"
            >
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                {editingCriterionId === criterion.id ? (
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <input
                      autoFocus
                      value={editCriterionName}
                      onChange={(e) => setEditCriterionName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEditCriterion(); if (e.key === "Escape") setEditingCriterionId(null); }}
                      className="flex-1 rounded-lg border border-amber-400/50 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-amber-400"
                    />
                    <button onClick={saveEditCriterion} className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-neutral-900">حفظ</button>
                    <button onClick={() => setEditingCriterionId(null)} className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400">إلغاء</button>
                  </div>
                ) : (
                  <h2 className="text-amber-400 font-semibold text-lg">{criterion.name}</h2>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-500 whitespace-nowrap">
                    المجموع الأقصى: {totalMax} نقطة
                  </span>
                  {editingCriterionId !== criterion.id && (
                    <>
                      <button
                        onClick={() => startEditCriterion(criterion.id, criterion.name)}
                        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-amber-400/50 hover:text-amber-400"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteCriterion(criterion.id, criterion.name)}
                        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-red-500/50 hover:text-red-400"
                      >
                        حذف
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 mb-4">
                {criterion.indicators.length === 0 ? (
                  <p className="text-sm text-neutral-500">لا توجد مؤشرات بعد</p>
                ) : (
                  criterion.indicators.map((ind) => (
                    <IndicatorRow
                      key={ind.id}
                      criterionId={criterion.id}
                      indicator={ind}
                      onSave={updateIndicator}
                      onDelete={deleteIndicator}
                    />
                  ))
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) =>
                    setIndicatorDrafts((prev) => ({
                      ...prev,
                      [criterion.id]: { ...draft, name: e.target.value },
                    }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleAddIndicator(criterion.id)}
                  placeholder="اسم المؤشر الجديد"
                  className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                />
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={draft.maxScore}
                  onChange={(e) =>
                    setIndicatorDrafts((prev) => ({
                      ...prev,
                      [criterion.id]: { ...draft, maxScore: e.target.value },
                    }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleAddIndicator(criterion.id)}
                  placeholder="الدرجة القصوى"
                  className="w-full sm:w-32 rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                />
                <button
                  onClick={() => handleAddIndicator(criterion.id)}
                  className="rounded-lg border border-amber-500/30 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-500/10 whitespace-nowrap"
                >
                  إضافة مؤشر
                </button>
              </div>
            </div>
          );
        })}

        {criteria.length === 0 && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-neutral-500">
            لا توجد معايير بعد — أضف أول معيار أدناه
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
        <h2 className="text-amber-400 font-semibold mb-4">إضافة معيار جديد</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCriterionName}
            onChange={(e) => setNewCriterionName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCriterion()}
            placeholder="اسم المعيار الجديد"
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-neutral-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
          />
          <button
            onClick={handleAddCriterion}
            className="rounded-lg bg-gradient-to-l from-amber-500 to-amber-400 px-5 py-2 font-semibold text-neutral-900 transition hover:from-amber-400 hover:to-amber-300"
          >
            إضافة
          </button>
        </div>
      </div>

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