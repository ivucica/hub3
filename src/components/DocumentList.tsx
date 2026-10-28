import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Search,
  Filter,
  Folder,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PaymentDocument } from '../types/payment';
import { formatEuro } from '../utils/paymentUtils';

interface DocumentListProps {
  documents: PaymentDocument[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  onAddDoc: () => void;
  onDuplicateDoc: (id: string) => void;
  onDeleteDoc: (id: string) => void;
  onLoadSamples: () => void;
  onResetToBlank: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  activeDocId,
  onSelectDoc,
  onAddDoc,
  onDuplicateDoc,
  onDeleteDoc,
  onLoadSamples,
  onResetToBlank,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [folderFilter, setFolderFilter] = useState('Sve');
  const [statusFilter, setStatusFilter] = useState<
    'sve' | 'neplaceno' | 'placeno' | 'kasnjenje' | 'naplata' | 'cekanje'
  >('sve');

  const folders = ['Sve', ...Array.from(new Set(documents.map((d) => d.folder).filter(Boolean)))];

  // Dynamic counts for status filters
  const countAll = documents.length;
  const countUnpaid = documents.filter((d) => d.status !== 'placeno').length;
  const countPaid = documents.filter((d) => d.status === 'placeno').length;
  const countOverdue = documents.filter((d) => d.status === 'kasnjenje').length;
  const countDueSoon = documents.filter((d) => d.status === 'naplata').length;
  const countWaiting = documents.filter((d) => d.status === 'cekanje' || d.status === 'novo').length;

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.ourDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.iban.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.pnb.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFolder = folderFilter === 'Sve' || doc.folder === folderFilter;

    let matchesStatus = true;
    if (statusFilter === 'neplaceno') {
      matchesStatus = doc.status !== 'placeno';
    } else if (statusFilter === 'placeno') {
      matchesStatus = doc.status === 'placeno';
    } else if (statusFilter === 'kasnjenje') {
      matchesStatus = doc.status === 'kasnjenje';
    } else if (statusFilter === 'naplata') {
      matchesStatus = doc.status === 'naplata';
    } else if (statusFilter === 'cekanje') {
      matchesStatus = doc.status === 'cekanje' || doc.status === 'novo';
    }

    return matchesSearch && matchesFolder && matchesStatus;
  });

  const totalAmount = filteredDocs.reduce((acc, d) => acc + (d.amount || 0), 0);

  const getStatusBadge = (status: PaymentDocument['status']) => {
    switch (status) {
      case 'placeno':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Plaćeno
          </span>
        );
      case 'kasnjenje':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100/80 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Kašnjenje
          </span>
        );
      case 'naplata':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            Naplata
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            Novo
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* List Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Nalozi u sesiji ({documents.length})
            </h2>
          </div>
          <button
            onClick={onAddDoc}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Novi nalog
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pretraži naloge, primatelja, IBAN..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter('sve')}
            className={`px-2 py-0.5 rounded-lg shrink-0 text-[10px] font-bold transition cursor-pointer ${
              statusFilter === 'sve'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Svi računi ({countAll})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('neplaceno')}
            className={`px-2 py-0.5 rounded-lg shrink-0 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'neplaceno'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
            title="Svi neplaćeni računi (kašnjenje + naplata + čekanje)"
          >
            <Clock className="w-2.5 h-2.5" />
            Neplaćeno ({countUnpaid})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('placeno')}
            className={`px-2 py-0.5 rounded-lg shrink-0 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'placeno'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
            }`}
            title="Svi plaćeni računi"
          >
            <CheckCircle2 className="w-2.5 h-2.5" />
            Plaćeno ({countPaid})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('kasnjenje')}
            className={`px-2 py-0.5 rounded-lg shrink-0 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'kasnjenje'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
            }`}
            title="Računi kojima je prošao rok dospijeća"
          >
            <AlertCircle className="w-2.5 h-2.5" />
            Kašnjenje ({countOverdue})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('naplata')}
            className={`px-2 py-0.5 rounded-lg shrink-0 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'naplata'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Dospijeva uskoro (manje od 14 dana)"
          >
            <Clock className="w-2.5 h-2.5" />
            Naplata ({countDueSoon})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('cekanje')}
            className={`px-2 py-0.5 rounded-lg shrink-0 text-[10px] font-bold transition cursor-pointer ${
              statusFilter === 'cekanje'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Više od 14 dana do roka"
          >
            Čekanje ({countWaiting})
          </button>
        </div>

        {/* Folder filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs scrollbar-none border-t border-slate-200/60 pt-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 mr-1">Mapa:</span>
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => setFolderFilter(f)}
              className={`px-2 py-0.5 rounded-md shrink-0 text-[10px] font-semibold transition cursor-pointer ${
                folderFilter === f
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}

          {(statusFilter !== 'sve' || folderFilter !== 'Sve' || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('sve');
                setFolderFilter('Sve');
                setSearchTerm('');
              }}
              className="text-[9px] text-red-600 hover:underline font-bold shrink-0 ml-auto cursor-pointer"
            >
              Poništi filtre
            </button>
          )}
        </div>
      </div>

      {/* Summary strip with dynamic status label */}
      <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">
          Prikazano: <strong className="text-slate-800">{filteredDocs.length}</strong>
          {filteredDocs.length !== documents.length && (
            <span className="text-slate-400 text-[10px]"> od {documents.length}</span>
          )}
        </span>
        <span className="text-slate-500 font-medium">
          {statusFilter === 'neplaceno'
            ? 'Ukupno neplaćeno: '
            : statusFilter === 'placeno'
            ? 'Ukupno plaćeno: '
            : statusFilter === 'kasnjenje'
            ? 'Ukupno u kašnjenju: '
            : statusFilter === 'naplata'
            ? 'Ukupno za naplatu (<14 d): '
            : statusFilter === 'cekanje'
            ? 'Ukupno na čekanju: '
            : 'Ukupan iznos: '}
          <strong
            className={`font-bold font-mono text-sm ${
              statusFilter === 'neplaceno'
                ? 'text-amber-700'
                : statusFilter === 'kasnjenje'
                ? 'text-red-700'
                : statusFilter === 'placeno'
                ? 'text-emerald-700'
                : statusFilter === 'naplata'
                ? 'text-amber-700'
                : statusFilter === 'cekanje'
                ? 'text-blue-700'
                : 'text-slate-900'
            }`}
          >
            {formatEuro(totalAmount)}
          </strong>
        </span>
      </div>

      {/* On-demand tools bar */}
      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] gap-2">
        <button
          onClick={onLoadSamples}
          className="flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-medium transition cursor-pointer"
          title="Učitaj 3 ogledna primjera s fiktivnim podacima (petar horvat, primjer d.o.o.)"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Učitaj ogledne primjere (fiktivni)</span>
        </button>

        <button
          onClick={onResetToBlank}
          className="text-slate-400 hover:text-red-600 transition cursor-pointer"
          title="Isprazni popis i postavi novi prazan obrazac"
        >
          Očisti sve
        </button>
      </div>

      {/* Scrollable list items */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Nema naloga koji odgovaraju pretrazi.
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isActive = doc.id === activeDocId;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc.id)}
                className={`group relative rounded-xl p-3 transition cursor-pointer border ${
                  isActive
                    ? 'border-red-500 bg-red-50/60 shadow-xs ring-1 ring-red-400'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-0.2 rounded">
                        {doc.folder || 'Opće'}
                      </span>
                      {getStatusBadge(doc.status)}
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 truncate" title={doc.ourDescription}>
                      {doc.ourDescription || doc.filename}
                    </h3>

                    <div className="text-[11px] text-slate-500 truncate">
                      {doc.recipient ? doc.recipient.split('\n')[0] : 'Nema primatelja'}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                      {doc.dueDate && (
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Dospijeće: {doc.dueDate}
                        </span>
                      )}
                      {doc.purposeCode && (
                        <span className="font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                          {doc.purposeCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    <span className="font-mono font-black text-slate-900 text-xs">
                      {formatEuro(doc.amount)}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateDoc(doc.id);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                        title="Dupliciraj nalog"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDoc(doc.id);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Obriši nalog"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
