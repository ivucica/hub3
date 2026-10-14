import React, { useState, useEffect } from 'react';
import {
  Folder,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Check,
  X,
  CreditCard,
  Tag,
} from 'lucide-react';
import { PaymentDocument } from '../types/payment';
import { formatEuro, computeDerivedStatus } from '../utils/paymentUtils';

interface DocumentHeaderCardProps {
  document: PaymentDocument;
  existingFolders: string[];
  onUpdate: (updated: PaymentDocument) => void;
}

export const DocumentHeaderCard: React.FC<DocumentHeaderCardProps> = ({
  document,
  existingFolders,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFolder, setEditFolder] = useState(document.folder || 'Opće');
  const [editFilename, setEditFilename] = useState(document.filename || '');
  const [editDescription, setEditDescription] = useState(document.ourDescription || '');
  const [editPaymentDate, setEditPaymentDate] = useState(document.paymentDate || '');

  // Keep local edit state in sync when selected document changes
  useEffect(() => {
    setEditFolder(document.folder || 'Opće');
    setEditFilename(document.filename || '');
    setEditDescription(document.ourDescription || '');
    setEditPaymentDate(document.paymentDate || '');
    setIsEditing(false);
  }, [document.id]);

  // Derived status based on paymentDate and dueDate
  const derived = computeDerivedStatus(document.dueDate, document.paymentDate);

  // Sync status if it differs from derived status
  useEffect(() => {
    if (document.status !== derived.status) {
      onUpdate({
        ...document,
        status: derived.status,
      });
    }
  }, [derived.status, document.dueDate, document.paymentDate]);

  const handleSave = () => {
    const newDerived = computeDerivedStatus(document.dueDate, editPaymentDate);
    onUpdate({
      ...document,
      folder: editFolder.trim() || 'Opće',
      filename: editFilename.trim(),
      ourDescription: editDescription.trim() || 'Platni nalog',
      paymentDate: editPaymentDate.trim() || undefined,
      status: newDerived.status,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditFolder(document.folder || 'Opće');
    setEditFilename(document.filename || '');
    setEditDescription(document.ourDescription || '');
    setEditPaymentDate(document.paymentDate || '');
    setIsEditing(false);
  };

  const handleSetTodayPayment = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const dateStr = `${day}.${month}.${year}`;
    
    if (isEditing) {
      setEditPaymentDate(dateStr);
    } else {
      const newDerived = computeDerivedStatus(document.dueDate, dateStr);
      onUpdate({
        ...document,
        paymentDate: dateStr,
        status: newDerived.status,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleClearPayment = () => {
    if (isEditing) {
      setEditPaymentDate('');
    } else {
      const newDerived = computeDerivedStatus(document.dueDate, '');
      onUpdate({
        ...document,
        paymentDate: undefined,
        status: newDerived.status,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const getStatusBadge = () => {
    switch (derived.status) {
      case 'placeno':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{derived.reason}</span>
          </div>
        );
      case 'kasnjenje':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 font-bold text-xs shadow-2xs animate-pulse">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Kašnjenje ({derived.reason})</span>
          </div>
        );
      case 'naplata':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-2xs">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Naplata ({derived.reason})</span>
          </div>
        );
      case 'cekanje':
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-xs shadow-2xs">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Čekanje ({derived.reason})</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs no-print transition-all">
      {isEditing ? (
        /* Edit Form Mode */
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5 text-red-600" />
              Uređivanje podataka zaglavlja (kategorija, naziv, datum)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                <X className="w-3.5 h-3.5" />
                Odustani
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition"
              >
                <Check className="w-3.5 h-3.5" />
                Spremi
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Categorization / Folder with suggestions */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Kategorija (Folder / Režija):
              </label>
              <input
                type="text"
                list="folder-suggestions"
                value={editFolder}
                onChange={(e) => setEditFolder(e.target.value)}
                placeholder="npr. Plin, Struja, Voda..."
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-semibold text-slate-800"
              />
              <datalist id="folder-suggestions">
                {existingFolders.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>

            {/* Filename */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Naziv datoteke / reference:
              </label>
              <input
                type="text"
                value={editFilename}
                onChange={(e) => setEditFilename(e.target.value)}
                placeholder="npr. Racun_10_2026.pdf"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-800"
              />
            </div>

            {/* Datum uplate (paymentDate) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Datum uplate (ako je plaćeno):
                </label>
                <button
                  type="button"
                  onClick={handleSetTodayPayment}
                  className="text-[10px] text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                >
                  Postavi danas
                </button>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={editPaymentDate}
                  onChange={(e) => setEditPaymentDate(e.target.value)}
                  placeholder="dd.mm.gggg"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-mono text-slate-800"
                />
                {editPaymentDate && (
                  <button
                    type="button"
                    onClick={handleClearPayment}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs"
                    title="Očisti datum uplate"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Opis / Naslov */}
            <div className="sm:col-span-3">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Opis (za nas / naslov naloga):
              </label>
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="npr. Akontacijska rata plina za studeni"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-semibold text-slate-900"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Normal Display Mode */
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Folder Pill + Filename + Title + Edit Button */}
          <div className="space-y-1.5 min-w-[260px] flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                <Folder className="w-3 h-3 text-red-600" />
                {document.folder || 'Opće'}
              </span>

              {document.filename && (
                <span className="text-xs font-medium text-slate-400 font-mono">
                  {document.filename}
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                title="Uredi kategoriju (folder), naziv i naslov"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {document.ourDescription || 'Platni nalog'}
              </h2>
            </div>
          </div>

          {/* Right: Payment Date, Status badge & Total Amount */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Quick Datum Uplate entry */}
            <div className="flex flex-col items-end text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Datum uplate:</span>
                {document.paymentDate ? (
                  <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {document.paymentDate}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSetTodayPayment}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer transition"
                  >
                    + Označi plaćeno danas
                  </button>
                )}

                {document.paymentDate && (
                  <button
                    type="button"
                    onClick={handleClearPayment}
                    className="text-slate-400 hover:text-red-600 p-0.5 transition"
                    title="Ukloni datum uplate"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="mt-1">
                {getStatusBadge()}
              </div>
            </div>

            {/* Total Amount Box */}
            <div className="text-right pl-3 sm:border-l sm:border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                Iznos naloga
              </span>
              <span className="text-base font-black text-slate-900 font-mono tracking-tight">
                {formatEuro(document.amount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
