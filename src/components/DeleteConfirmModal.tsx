import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { PaymentDocument } from '../types/payment';
import { formatEuro } from '../utils/paymentUtils';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  document: PaymentDocument | null;
  onClose: () => void;
  onConfirmDelete: (doc: PaymentDocument) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  document,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-full bg-red-100 text-red-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Potvrda brisanja naloga
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Jeste li sigurni da želite ukloniti ovaj platni nalog iz sesije?
            </p>
          </div>
        </div>

        {/* Target Document Details */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              {document.folder || 'Opće'}
            </span>
            <span className="font-mono font-bold text-slate-900">
              {formatEuro(document.amount)}
            </span>
          </div>
          <div className="font-bold text-slate-800 text-xs truncate">
            {document.ourDescription || document.filename || 'Platni nalog'}
          </div>
          {document.recipient && (
            <div className="text-[11px] text-slate-500 truncate">
              {document.recipient.split('\n')[0]}
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400 italic">
          Nakon brisanja imat ćete mogućnost poništavanja (Undo) putem obavijesti na dnu zaslona.
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Odustani
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete(document);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Obriši nalog
          </button>
        </div>
      </div>
    </div>
  );
};
