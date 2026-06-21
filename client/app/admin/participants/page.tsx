"use client";

import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { useAppData } from "@/context/AppDataContext";
import { useScores } from "@/context/ScoresContext";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import type { DeleteResult } from "@/context/AppDataContext";
import { calculateAge } from "@/lib/utils";
import { Participant } from "@/types";

interface CsvRow {
  fullName?: string;
  birthDate?: string;
  age?: string;
  category?: string;
  circle?: string;
  municipality?: string;
}

// ---- نموذج بيانات المشارك (إضافة وتعديل معًا) ----
function ParticipantFormModal({
  initial,
  onClose,
  onSubmit,
  title,
  submitLabel,
}: {
  initial: Partial<Participant>;
  onClose: () => void;
  onSubmit: (data: {
    fullName: string;
    birthDate: string;
    age: number;
    categoryId: string;
    circleId: string;
    municipality: string;
    phaseId: string;
    qualified: boolean;
  }) => string | null; // ترجع نص خطأ أو null عند النجاح
  title: string;
  submitLabel: string;
}) {
  const { categories, circles, phases } = useAppData();

  const [fullName, setFullName] = useState(initial.fullName || "");
  const [birthDate, setBirthDate] = useState(initial.birthDate || "");
  const [age, setAge] = useState(initial.age?.toString() || "");
  const [categoryId, setCategoryId] = useState(initial.categoryId || categories[0]?.id || "");
  const [phaseId, setPhaseId] = useState(initial.phaseId || phases[0]?.id || "");
  const [circleId, setCircleId] = useState(initial.circleId || "");
  const [municipality, setMunicipality] = useState(initial.municipality || "");
  const [qualified, setQualified] = useState(initial.qualified || false);
  const [error, setError] = useState<string | null>(null);

  const phaseCircles = circles.filter((c) => c.phaseId === phaseId);

  function handleBirthDateChange(value: string) {
    setBirthDate(value);
    if (value) {
      setAge(calculateAge(value).toString());
    }
  }

  function handleSubmit() {
    setError(null);
    if (!fullName.trim() || !categoryId || !phaseId || !circleId) {
      setError("الاسم، الفئة، المرحلة، والدائرة/المركز حقول مطلوبة");
      return;
    }
    const parsedAge = parseInt(age, 10);
    const result = onSubmit({
      fullName: fullName.trim(),
      birthDate: birthDate.trim(),
      age: isNaN(parsedAge) ? 0 : parsedAge,
      categoryId,
      circleId,
      municipality: municipality.trim(),
      phaseId,
      qualified,
    });
    if (result) {
      setError(result);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-500/20 bg-neutral-900 p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-amber-400 mb-5">{title}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs text-neutral-400 mb-1 block">الاسم الكامل *</label>
            <input
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400 mb-1 block">تاريخ الميلاد</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => handleBirthDateChange(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400 mb-1 block">العمر</label>
            <input
              type="number"
              min={0}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="يُحسب تلقائيًا من تاريخ الميلاد"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400 mb-1 block">الفئة العمرية *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
            >
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-neutral-400 mb-1 block">البلدية</label>
            <input
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
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

          <div>
            <label className="text-xs text-neutral-400 mb-1 block">الدائرة / المركز *</label>
            <select
              value={circleId}
              onChange={(e) => setCircleId(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 outline-none focus:border-amber-400"
            >
              <option value="">— اختر —</option>
              {phaseCircles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center gap-2 mt-1">
            <input
              id="qualified-checkbox"
              type="checkbox"
              checked={qualified}
              onChange={(e) => setQualified(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 accent-amber-400"
            />
            <label htmlFor="qualified-checkbox" className="text-sm text-neutral-300">
              مؤهّل للمرحلة التالية
            </label>
          </div>
        </div>

        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-lg border border-neutral-700 py-2.5 text-sm text-neutral-400 hover:bg-neutral-800">إلغاء</button>
          <button onClick={handleSubmit} className="flex-1 rounded-lg bg-amber-400 py-2.5 text-sm font-bold text-neutral-900 hover:bg-amber-300">{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function ParticipantsPage() {
  const {
    participants, categories, circles, phases,
    addParticipants, updateParticipant, deleteParticipant,
  } = useAppData();
  const { getScoresCountForParticipant, deleteScoresForParticipant } = useScores();

  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [csvPhaseId, setCsvPhaseId] = useState(phases[0]?.id || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Participant | null>(null);
  const [pending, setPending] = useState<(DeleteResult & { name: string }) | null>(null);

  // ---- بحث وفلترة ----
  const [search, setSearch] = useState("");
  const [filterPhase, setFilterPhase] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCircle, setFilterCircle] = useState("");
  const [filterQualified, setFilterQualified] = useState("");

  function findCategoryIdByName(name: string): string | undefined {
    return categories.find((c) => c.name.trim() === name.trim())?.id;
  }

  function findCircleIdByName(name: string): string | undefined {
    return circles.find((c) => c.name.trim() === name.trim())?.id;
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const newParticipants: Participant[] = [];
        let skipped = 0;

        result.data.forEach((row) => {
          const categoryId = row.category ? findCategoryIdByName(row.category) : undefined;
          const circleId = row.circle ? findCircleIdByName(row.circle) : undefined;

          if (!row.fullName || !categoryId || !circleId) {
            skipped++;
            return;
          }

          newParticipants.push({
            id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            fullName: row.fullName.trim(),
            birthDate: row.birthDate?.trim() || "",
            age: row.age ? parseInt(row.age, 10) : (row.birthDate ? calculateAge(row.birthDate) : 0),
            categoryId,
            circleId,
            municipality: row.municipality?.trim() || "",
            phaseId: csvPhaseId,
            qualified: false,
          });
        });

        addParticipants(newParticipants);
        setImportMessage(
          `تم استيراد ${newParticipants.length} مشارك بنجاح` +
            (skipped > 0 ? ` — تم تجاهل ${skipped} صف (بيانات ناقصة أو فئة/دائرة غير معروفة)` : "")
        );
      },
      error: (err) => {
        setImportMessage(`خطأ في قراءة الملف: ${err.message}`);
      },
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleAddSubmit(data: Omit<Participant, "id">): string | null {
    addParticipants([{ ...data, id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }]);
    return null;
  }

  function handleEditSubmit(data: Omit<Participant, "id">): string | null {
    if (!editTarget) return "خطأ غير متوقع";
    updateParticipant(editTarget.id, data);
    return null;
  }

  function handleDelete(participant: Participant) {
    const relatedScores = getScoresCountForParticipant(participant.id);
    if (relatedScores > 0) {
      setPending({
        success: false,
        relatedSummary: `${relatedScores} درجة مُدخلة`,
        confirm: () => {
          deleteScoresForParticipant(participant.id);
          deleteParticipant(participant.id);
        },
        name: participant.fullName,
      });
      return;
    }
    deleteParticipant(participant.id);
  }

  // ---- تطبيق البحث والفلاتر ----
  const filtered = useMemo(() => {
    return participants.filter((p) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = p.fullName.toLowerCase().includes(q);
        const matchesMunicipality = p.municipality.toLowerCase().includes(q);
        if (!matchesName && !matchesMunicipality) return false;
      }
      if (filterPhase && p.phaseId !== filterPhase) return false;
      if (filterCategory && p.categoryId !== filterCategory) return false;
      if (filterCircle && p.circleId !== filterCircle) return false;
      if (filterQualified === "yes" && !p.qualified) return false;
      if (filterQualified === "no" && p.qualified) return false;
      return true;
    });
  }, [participants, search, filterPhase, filterCategory, filterCircle, filterQualified]);

  const hasActiveFilters = !!(search || filterPhase || filterCategory || filterCircle || filterQualified);

  function clearFilters() {
    setSearch("");
    setFilterPhase("");
    setFilterCategory("");
    setFilterCircle("");
    setFilterQualified("");
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">المشاركون</h1>
          <p className="text-neutral-400 mt-1">
            إجمالي {participants.length} مشارك — {filtered.length} ظاهر بعد الفلترة
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="rounded-lg bg-gradient-to-l from-amber-500 to-amber-400 px-5 py-2 font-semibold text-neutral-900 transition hover:from-amber-400 hover:to-amber-300 whitespace-nowrap"
        >
          + إضافة مشارك
        </button>
      </div>

      {/* ======= استيراد CSV ======= */}
      <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
        <h2 className="text-amber-400 font-semibold mb-2">استيراد عبر CSV</h2>
        <p className="text-xs text-neutral-500 mb-4">
          أعمدة الملف المطلوبة بالضبط:{" "}
          <code className="text-neutral-300">fullName, birthDate, age, category, circle, municipality</code>
          <br />
          قيم <code className="text-neutral-300">category</code> يجب أن تطابق أسماء الفئات الموجودة (الأطفال، اليافعون، الشباب)
          <br />
          قيم <code className="text-neutral-300">circle</code> يجب أن تطابق أسماء الدوائر الموجودة بالضبط
        </p>

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <select
            value={csvPhaseId}
            onChange={(e) => setCsvPhaseId(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400"
          >
            {phases.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.name}
              </option>
            ))}
          </select>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="text-sm text-neutral-300 file:ml-3 file:rounded-lg file:border-0 file:bg-amber-500/15 file:px-4 file:py-2 file:text-amber-300 file:cursor-pointer hover:file:bg-amber-500/25"
          />
        </div>

        {importMessage && (
          <p className="mt-3 text-sm text-emerald-400">{importMessage}</p>
        )}
      </div>

      {/* ======= بحث وفلترة ======= */}
      <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-amber-400 font-semibold">بحث وفلترة</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-neutral-400 hover:text-amber-400 transition"
            >
              مسح الفلاتر ✕
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو البلدية..."
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select
              value={filterPhase}
              onChange={(e) => { setFilterPhase(e.target.value); setFilterCircle(""); }}
              className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400"
            >
              <option value="">كل المراحل</option>
              {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400"
            >
              <option value="">كل الفئات</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select
              value={filterCircle}
              onChange={(e) => setFilterCircle(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400"
            >
              <option value="">كل الدوائر/المراكز</option>
              {circles
                .filter((c) => !filterPhase || c.phaseId === filterPhase)
                .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select
              value={filterQualified}
              onChange={(e) => setFilterQualified(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400"
            >
              <option value="">كل الحالات</option>
              <option value="yes">مؤهّل</option>
              <option value="no">غير مؤهّل</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======= قائمة المشاركين (بطاقات متجاوبة) ======= */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-neutral-500">
            {participants.length === 0
              ? "لا يوجد مشاركون بعد — أضف أول مشارك أو استورد ملف CSV"
              : "لا توجد نتائج مطابقة لبحثك/فلترتك"}
          </div>
        )}

        {filtered.map((p) => {
          const categoryName = categories.find((c) => c.id === p.categoryId)?.name;
          const circleName = circles.find((c) => c.id === p.circleId)?.name;
          const phaseName = phases.find((ph) => ph.id === p.phaseId)?.name;

          return (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-neutral-800 px-4 py-3 transition hover:border-neutral-700"
            >
              <div className="flex-1 min-w-[160px]">
                <p className="text-neutral-100 font-medium truncate">{p.fullName}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {p.municipality || "—"} {p.age ? `· ${p.age} سنة` : ""}
                </p>
              </div>

              <span className="text-xs text-neutral-400 bg-neutral-800 rounded-full px-2.5 py-1 whitespace-nowrap">
                {categoryName || "—"}
              </span>
              <span className="text-xs text-neutral-400 bg-neutral-800 rounded-full px-2.5 py-1 whitespace-nowrap">
                {circleName || "—"}
              </span>
              <span className="text-xs text-neutral-400 bg-neutral-800 rounded-full px-2.5 py-1 whitespace-nowrap">
                {phaseName || "—"}
              </span>
              <span
                className={`text-xs rounded-full px-2.5 py-1 whitespace-nowrap ${
                  p.qualified ? "bg-emerald-500/15 text-emerald-300" : "bg-neutral-800 text-neutral-500"
                }`}
              >
                {p.qualified ? "مؤهّل ✓" : "غير مؤهّل"}
              </span>

              <div className="flex gap-2 ms-auto">
                <button
                  onClick={() => setEditTarget(p)}
                  className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-amber-400/50 hover:text-amber-400"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-red-500/50 hover:text-red-400"
                >
                  حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {addOpen && (
        <ParticipantFormModal
          initial={{ phaseId: csvPhaseId }}
          title="إضافة مشارك جديد"
          submitLabel="إضافة"
          onClose={() => setAddOpen(false)}
          onSubmit={handleAddSubmit}
        />
      )}

      {editTarget && (
        <ParticipantFormModal
          initial={editTarget}
          title="تعديل بيانات المشارك"
          submitLabel="حفظ"
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditSubmit}
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