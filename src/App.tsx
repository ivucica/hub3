/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  loadStoredSession,
  saveSessionToStorage,
  exportSessionToJson,
  parseImportedJson,
} from './utils/storage';
import { PaymentDocument } from './types/payment';
import { INITIAL_DOCUMENTS, FICTIONAL_SAMPLE_DOCUMENTS } from './data/initialData';
import { Header } from './components/Header';
import { DocumentList } from './components/DocumentList';
import { PaymentSlip } from './components/PaymentSlip';
import { ScannerModal } from './components/ScannerModal';
import { SepaQrModal } from './components/SepaQrModal';
import { CsvBatchModal } from './components/CsvBatchModal';
import { InfoModal } from './components/InfoModal';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  FileText,
  Folder,
  Tag,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { formatEuro } from './utils/paymentUtils';

export default function App() {
  const [documents, setDocuments] = useState<PaymentDocument[]>(() => {
    const { documents } = loadStoredSession();
    return documents;
  });

  const [activeDocId, setActiveDocId] = useState<string>(() => {
    const { activeDocId, documents } = loadStoredSession();
    return activeDocId || documents[0]?.id || '';
  });

  // Mobile navigation tab ('list' | 'slip')
  const [mobileTab, setMobileTab] = useState<'list' | 'slip'>('slip');

  // Modals state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerFormat, setScannerFormat] = useState<'HUB3' | 'SEPA'>('HUB3');
  const [sepaExportOpen, setSepaExportOpen] = useState(false);
  const [csvBatchOpen, setCsvBatchOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<'purpose' | 'model'>('purpose');
  const [infoModalSelectedCode, setInfoModalSelectedCode] = useState<string | undefined>(undefined);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isOnline = useOnlineStatus();

  // Save to localStorage automatically on state change
  useEffect(() => {
    if (documents.length > 0) {
      saveSessionToStorage(documents, activeDocId);
    }
  }, [documents, activeDocId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const activeDoc =
    documents.find((d) => d.id === activeDocId) ||
    documents[0] || {
      id: 'default',
      folder: 'Opće',
      filename: 'Novi_Nalog.pdf',
      ourDescription: 'Novi platni nalog',
      dueDate: '',
      amount: 0,
      status: 'novo',
      model: 'HR01',
      pnb: '',
      iban: '',
      recipient: '',
      payer: '',
      description: '',
      purposeCode: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

  const handleUpdateActiveDoc = (updated: PaymentDocument) => {
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleSelectDoc = (id: string) => {
    setActiveDocId(id);
    setMobileTab('slip'); // Switch to slip on mobile upon selection
  };

  const handleAddDoc = () => {
    const newDoc: PaymentDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      folder: activeDoc.folder || 'Opće',
      filename: `Novi_racun_${documents.length + 1}.pdf`,
      ourDescription: `Novi nalog #${documents.length + 1}`,
      dueDate: '',
      amount: 0,
      status: 'novo',
      model: 'HR01',
      pnb: '',
      iban: '',
      recipient: '',
      payer: activeDoc.payer || '', // Pre-fill payer if available
      description: '',
      purposeCode: 'COST',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    setMobileTab('slip');
    showToast('Dodan je novi prazan nalog');
  };

  const handleDuplicateDoc = (id: string) => {
    const target = documents.find((d) => d.id === id);
    if (!target) return;

    const duplicated: PaymentDocument = {
      ...target,
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ourDescription: `${target.ourDescription} (Kopija)`,
      status: 'novo',
      paymentDate: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDocuments((prev) => [duplicated, ...prev]);
    setActiveDocId(duplicated.id);
    showToast('Nalog je uspješno dupliciran');
  };

  const handleDeleteDoc = (id: string) => {
    if (documents.length <= 1) {
      showToast('Sesija mora sadržavati barem jedan nalog.');
      return;
    }
    const filtered = documents.filter((d) => d.id !== id);
    setDocuments(filtered);
    if (activeDocId === id) {
      setActiveDocId(filtered[0].id);
    }
    showToast('Nalog je uklonjen iz sesije.');
  };

  const handleLoadFictionalSamples = () => {
    setDocuments(FICTIONAL_SAMPLE_DOCUMENTS);
    setActiveDocId(FICTIONAL_SAMPLE_DOCUMENTS[0].id);
    showToast('Učitani su ogledni fiktivni primjeri naloga.');
  };

  const handleResetToBlank = () => {
    setDocuments(INITIAL_DOCUMENTS);
    setActiveDocId(INITIAL_DOCUMENTS[0].id);
    showToast('Sesija je očišćena. Postavljen je novi prazan nalog.');
  };

  const handleBatchImport = (newDocs: PaymentDocument[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setDocuments(newDocs);
      setActiveDocId(newDocs[0]?.id || '');
      showToast(`Sesija je zamijenjena s ${newDocs.length} naloga.`);
    } else {
      setDocuments((prev) => [...newDocs, ...prev]);
      setActiveDocId(newDocs[0]?.id || activeDocId);
      showToast(`Uvezeno je ${newDocs.length} novih naloga.`);
    }
  };

  const handleExportJson = () => {
    exportSessionToJson(documents, activeDocId);
    showToast('Sesija je izvezena u JSON datoteku.');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseImportedJson(text);
      if (result.error) {
        showToast(result.error);
        return;
      }
      if (result.documents.length > 0) {
        setDocuments(result.documents);
        setActiveDocId(result.activeDocId || result.documents[0].id);
        showToast(`Uspješno učitana sesija (${result.documents.length} naloga).`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const handleOpenScanner = (format: 'HUB3' | 'SEPA') => {
    setScannerFormat(format);
    setScannerOpen(true);
  };

  const handleApplyScannedData = (data: Partial<PaymentDocument>) => {
    const updated: PaymentDocument = {
      ...activeDoc,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    handleUpdateActiveDoc(updated);
    showToast('Podaci naloga su uspješno zamijenjeni očitanim vrijednostima.');
  };

  const handleOpenInfo = (type: 'purpose' | 'model', code?: string) => {
    setInfoModalType(type);
    setInfoModalSelectedCode(code);
    setInfoModalOpen(true);
  };

  const handleSelectCodeFromInfo = (code: string) => {
    if (infoModalType === 'purpose') {
      handleUpdateActiveDoc({ ...activeDoc, purposeCode: code });
      showToast(`Postavljena šifra namjene: ${code}`);
    } else {
      handleUpdateActiveDoc({ ...activeDoc, model: code });
      showToast(`Postavljen model: ${code}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* App Header */}
      <Header
        onOpenCsvBatch={() => setCsvBatchOpen(true)}
        onExportSessionJson={handleExportJson}
        onImportSessionJson={handleImportJson}
        onOpenCatalog={() => handleOpenInfo('purpose')}
      />

      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 no-print shadow-xs">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Aplikacija radi u izvanmrežnom (Offline) načinu. Svi nalozi, barkodovi i izvoz rade lokalno u pregledniku.
        </div>
      )}

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Mobile View Switcher */}
        <div className="flex md:hidden bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold shadow-2xs no-print">
          <button
            onClick={() => setMobileTab('list')}
            className={`flex-1 py-2 text-center rounded-lg transition ${
              mobileTab === 'list'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Popis naloga ({documents.length})
          </button>
          <button
            onClick={() => setMobileTab('slip')}
            className={`flex-1 py-2 text-center rounded-lg transition ${
              mobileTab === 'slip'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Uplatnica (Obrazac)
          </button>
        </div>

        {/* Layout: Sidebar list (desktop) + Main Slip Workspace */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Documents list pane */}
          <div
            className={`md:col-span-4 lg:col-span-4 h-[calc(100vh-140px)] sticky top-20 document-list-pane ${
              mobileTab === 'list' ? 'block' : 'hidden md:block'
            }`}
          >
            <DocumentList
              documents={documents}
              activeDocId={activeDocId}
              onSelectDoc={handleSelectDoc}
              onAddDoc={handleAddDoc}
              onDuplicateDoc={handleDuplicateDoc}
              onDeleteDoc={handleDeleteDoc}
              onLoadSamples={handleLoadFictionalSamples}
              onResetToBlank={handleResetToBlank}
            />
          </div>

          {/* Right Column: Active Payment Slip Workspace */}
          <div
            className={`md:col-span-8 lg:col-span-8 space-y-4 ${
              mobileTab === 'slip' ? 'block' : 'hidden md:block'
            }`}
          >
            {/* Active Document Top Details Strip */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                    {activeDoc.folder || 'Opće'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {activeDoc.filename || 'Uplatnica'}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  {activeDoc.ourDescription || 'Platni nalog'}
                </h2>
              </div>

              {/* Status Switcher & Info */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-500">Status:</span>
                  <select
                    value={activeDoc.status}
                    onChange={(e) =>
                      handleUpdateActiveDoc({
                        ...activeDoc,
                        status: e.target.value as PaymentDocument['status'],
                      })
                    }
                    className={`font-semibold text-xs rounded-xl px-2.5 py-1 border focus:outline-none transition cursor-pointer ${
                      activeDoc.status === 'placeno'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : activeDoc.status === 'kasnjenje'
                        ? 'bg-red-50 text-red-800 border-red-300'
                        : activeDoc.status === 'naplata'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    <option value="novo">Novo</option>
                    <option value="kasnjenje">Kašnjenje</option>
                    <option value="naplata">Naplata</option>
                    <option value="placeno">Plaćeno</option>
                    <option value="cekanje">Čekanje</option>
                  </select>
                </div>

                <div className="text-right pl-3 border-l border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-medium">Ukupan iznos</span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    {formatEuro(activeDoc.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Payment Slip Component */}
            <PaymentSlip
              document={activeDoc}
              onChange={handleUpdateActiveDoc}
              onOpenScanner={handleOpenScanner}
              onOpenSepaExport={() => setSepaExportOpen(true)}
              onOpenInfo={handleOpenInfo}
            />
          </div>

        </div>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <ScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        expectedFormat={scannerFormat}
        onApplyData={handleApplyScannedData}
      />

      <SepaQrModal
        isOpen={sepaExportOpen}
        onClose={() => setSepaExportOpen(false)}
        document={activeDoc}
      />

      <CsvBatchModal
        isOpen={csvBatchOpen}
        onClose={() => setCsvBatchOpen(false)}
        currentDocuments={documents}
        onImportDocuments={handleBatchImport}
      />

      <InfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        type={infoModalType}
        selectedCode={infoModalSelectedCode}
        onSelectCode={handleSelectCodeFromInfo}
      />
    </div>
  );
}
