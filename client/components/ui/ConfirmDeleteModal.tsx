"use client";

interface Props {
  isOpen: boolean;
  itemName: string;
  relatedSummary?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({ isOpen, itemName, relatedSummary, onConfirm, onCancel }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-red-500/30 bg-neutral-900 p-6 shadow-2xl">
        {/* أيقونة تحذير */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 mx-auto">
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h3 className="text-center text-lg font-bold text-neutral-100 mb-2">تأكيد الحذف</h3>

        {relatedSummary ? (
          <p className="text-center text-sm text-neutral-400 mb-4">
            سيؤدي حذف{" "}
            <span className="font-semibold text-amber-400">«{itemName}»</span>{" "}
            إلى حذف{" "}
            <span className="font-semibold text-red-400">{relatedSummary}</span>{" "}
            مرتبطة به. هذه العملية لا يمكن التراجع عنها.
          </p>
        ) : (
          <p className="text-center text-sm text-neutral-400 mb-4">
            هل أنت متأكد من حذف{" "}
            <span className="font-semibold text-amber-400">«{itemName}»</span>؟
            لا يمكن التراجع عن هذه العملية.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-400"
          >
            {relatedSummary ? "حذف شامل" : "حذف"}
          </button>
        </div>
      </div>
    </div>
  );
}