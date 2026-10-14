import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  X,
  ListPlus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { PaymentDocument } from '../types/payment';
import { parseBatchData, exportToDelimited } from '../utils/csvParser';
import { formatEuro } from '../utils/paymentUtils';

interface CsvBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDocuments: PaymentDocument[];
  onImportDocuments: (docs: PaymentDocument[], mode: 'append' | 'replace') => void;
}

export const CsvBatchModal: React.FC<CsvBatchModalProps> = ({
  isOpen,
  onClose,
  currentDocuments,
  onImportDocuments,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [rawText, setRawText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [exportDelimiter, setExportDelimiter] = useState<'\t' | ';' | ','>('\t');
  const [copied, setCopied] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{
    documents: PaymentDocument[];
    warnings: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleParse = (text: string) => {
    setRawText(text);
    if (!text.trim()) {
      setParsedPreview(null);
      return;
    }
    const result = parseBatchData(text);
    setParsedPreview(result);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleParse(content);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleExecuteImport = () => {
    if (!parsedPreview || parsedPreview.documents.length === 0) return;
    onImportDocuments(parsedPreview.documents, importMode);
    onClose();
  };

  const sampleTsvData = `Rezija (folder)\tFilename\tKod (ako odvojen)\tStavka unutar file\tOpis (za nas)\tDospijece\tIznos\tdatum uplate (ako je rijeseno)\tstatus\tracun br\tmodel i poziv na broj\tiban\tprimatelj\tplatitelj\topis placanja\tsifra namjene
Režije\tRačun_Primjer_1.pdf\t\t\tObračun komunalnih usluga (Ogledni primjer)\t15/11/26\t18,50 €\t\tnovo\t001122-3344-55\tHR01 001122-3344-55\tHR1210010051863000160\t"KOMUNALNO PODUZEĆE PRIMJER d.o.o.\nRadnička cesta 1\n10000 Zagreb"\t"PETAR HORVAT\nIlica 100\n10000 Zagreb"\t"Obračun usluga za ogledno razdoblje"\tCOST
Režije\tRačun_Primjer_2.pdf\t\t\tPotrošnja vode (Ogledni primjer)\t20/11/26\t9,40 €\t\tnovo\t554433-2211-00\tHR01 554433-2211-00\tHR9823600001500000000\t"VODOOPSKRBA PRIMJER d.o.o.\nFolnegovićeva 1\n10000 Zagreb"\t"PETAR HORVAT\nIlica 100\n10000 Zagreb"\t"Račun za potrošnju vode"\tWTER`;

  const exportedText = exportToDelimited(currentDocuments, exportDelimiter);

  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadExport = () => {
    const ext = exportDelimiter === '\t' ? 'tsv' : 'csv';
    const blob = new Blob([exportedText], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nalozi_export_${new Date().toISOString().slice(0, 10)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Serijski Uvoz i Izvoz Naloga (CSV / Excel TSV)
              </h2>
              <p className="text-xs text-slate-500">
                Kopirajte i zalijepite ćelije iz Excela ili Google Sheets tablice, ili prenesite datoteku
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            Uvoz u sesiju
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Download className="w-4 h-4" />
            Izvoz trenutne sesije ({currentDocuments.length} naloga)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'import' ? (
            <div className="space-y-4">
              {/* Instructions and Example Loader */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <span className="leading-snug">
                  Označite retke u Excelu/Sheets tablici (s zaglavljem ili bez) i zalijepite ih u polje ispod.
                </span>
                <button
                  onClick={() => handleParse(sampleTsvData)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 rounded-lg text-xs font-semibold text-slate-700 hover:text-emerald-700 transition cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Učitaj primjer tablice
                </button>
              </div>

              {/* Textarea or File input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-700">
                    Zalijepite CSV / TSV tablične podatke:
                  </label>
                  <label className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Ili odaberite .csv / .tsv datoteku
                    <input
                      type="file"
                      accept=".csv,.tsv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => handleParse(e.target.value)}
                  rows={6}
                  placeholder="Zalijepite podatke ovdje (npr. Plin	Račun 6_2026.pdf	...	14,83 €	...	HR7124020061100662212)"
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Import Mode Selector */}
              <div className="flex items-center gap-4 text-xs font-medium text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span>Način uvoza:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  Dodaj u postojeću sesiju ({currentDocuments.length} postojećih)
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-amber-700 font-semibold">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  Zamijeni trenutnu sesiju novim nalozima
                </label>
              </div>

              {/* Warnings */}
              {parsedPreview?.warnings && parsedPreview.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Napomene pri parsiranju:
                  </div>
                  {parsedPreview.warnings.map((w, idx) => (
                    <div key={idx} className="pl-5 text-[11px]">{w}</div>
                  ))}
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedPreview && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Pretpregled ({parsedPreview.documents.length} prepoznatih naloga):
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="p-2 font-semibold">Folder</th>
                          <th className="p-2 font-semibold">Opis / Naziv</th>
                          <th className="p-2 font-semibold text-right">Iznos</th>
                          <th className="p-2 font-semibold">IBAN Primatelja</th>
                          <th className="p-2 font-semibold">Poziv na broj</th>
                          <th className="p-2 font-semibold">Namjena</th>
                          <th className="p-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedPreview.documents.map((doc, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="p-2 font-medium text-slate-700">{doc.folder}</td>
                            <td className="p-2 text-slate-800 max-w-[160px] truncate" title={doc.ourDescription}>
                              {doc.ourDescription}
                            </td>
                            <td className="p-2 text-right font-bold text-slate-900 whitespace-nowrap">
                              {formatEuro(doc.amount)}
                            </td>
                            <td className="p-2 font-mono text-[10px] text-slate-600 max-w-[140px] truncate">
                              {doc.iban}
                            </td>
                            <td className="p-2 font-mono text-[10px] text-slate-600 max-w-[140px] truncate">
                              {doc.model} {doc.pnb}
                            </td>
                            <td className="p-2 font-mono font-bold text-emerald-700">
                              {doc.purposeCode || '—'}
                            </td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                doc.status === 'placeno'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : doc.status === 'kasnjenje'
                                  ? 'bg-red-100 text-red-800'
                                  : doc.status === 'naplata'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {doc.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Export Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-slate-700">Format razdjelnika:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="delimiter"
                      value="\t"
                      checked={exportDelimiter === '\t'}
                      onChange={() => setExportDelimiter('\t')}
                    />
                    Tabulator (TSV - Excel / Sheets)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="delimiter"
                      value=";"
                      checked={exportDelimiter === ';'}
                      onChange={() => setExportDelimiter(';')}
                    />
                    Točka-zarez (HR CSV)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="delimiter"
                      value=","
                      checked={exportDelimiter === ','}
                      onChange={() => setExportDelimiter(',')}
                    />
                    Zarez (Standard CSV)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyExport}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Kopirano!' : 'Kopiraj za Excel'}
                  </button>
                  <button
                    onClick={handleDownloadExport}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Preuzmi datoteku
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Pretpregled izvoza:
                </label>
                <textarea
                  readOnly
                  value={exportedText}
                  rows={10}
                  className="w-full text-xs font-mono p-3 bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Odustani
          </button>

          {activeTab === 'import' && (
            <button
              onClick={handleExecuteImport}
              disabled={!parsedPreview || parsedPreview.documents.length === 0}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              <ListPlus className="w-4 h-4" />
              Uvezi u sesiju ({parsedPreview?.documents.length || 0} naloga)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
