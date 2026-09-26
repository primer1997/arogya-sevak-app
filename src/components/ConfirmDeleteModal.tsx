import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  itemName: string;
  itemDetails?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  isOpen,
  title = 'नोंद हटवण्याची पुष्टी करा',
  itemName,
  itemDetails,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      id="confirm-delete-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        id="confirm-delete-modal-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 sm:p-6 text-left relative animate-scale-in"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="बंद करा"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1 pr-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              तुम्हाला <span className="font-bold text-slate-900">"{itemName}"</span> यांचे रेकॉर्ड कायमचे हटवायचे आहे का?
            </p>

            {itemDetails && (
              <div className="mt-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-mono">
                {itemDetails}
              </div>
            )}

            <div className="mt-2 text-[11px] text-rose-600 font-medium">
              सूचना: ही नोंद डेटाबेसमधून कायमची हटवली जाईल व पूर्ववत करता येणार नाही.
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            id="cancel-delete-btn"
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            रद्द करा
          </button>

          <button
            id="confirm-delete-action-btn"
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            होय, नोंद हटवा
          </button>
        </div>
      </div>
    </div>
  );
}
