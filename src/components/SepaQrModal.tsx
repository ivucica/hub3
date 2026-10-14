import React, { useEffect, useRef, useState } from 'react';
import {
  QrCode,
  Copy,
  Download,
  X,
  Check,
  Smartphone,
  ExternalLink,
  Sliders,
  Info,
} from 'lucide-react';
import { PaymentDocument, RevolutExtMode } from '../types/payment';
import { buildSepaQrPayload, formatEuro } from '../utils/paymentUtils';
import { renderSepaQr, downloadCanvasAsPng } from '../utils/barcodeGenerator';

interface SepaQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: PaymentDocument;
}

export const SepaQrModal: React.FC<SepaQrModalProps> = ({ isOpen, onClose, document }) => {
  const [extMode, setExtMode] = useState<RevolutExtMode>('0');
  const [customSuffix, setCustomSuffix] = useState('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { payload, structuredRef, unstructuredRef } = buildSepaQrPayload(
    document,
    extMode,
    customSuffix
  );

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      renderSepaQr(canvasRef.current, payload, { scale: 5 });
    }
  }, [isOpen, payload]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const cleanFileName = (document.filename || 'sepa_qr')
      .replace(/\.[^/.]+$/, '')
      .replace(/\s+/g, '_');
    downloadCanvasAsPng(canvasRef.current, `${cleanFileName}_sepa_qr.png`);
  };

  if (!isOpen) return null;

  const modeDescriptions: Record<RevolutExtMode, string> = {
    '0': 'Standardno (bez proširenja referenca)',
    '1': 'Dodaj 1. redak opisa u poziv na broj',
    '2': 'Dodaj pošiljatelja (1. red) + opis (1. red)',
    '3': 'Dodaj samo pošiljatelja (1. red)',
    '4': 'Dodaj cijeli opis u poziv na broj',
    '5': 'Dodaj pošiljatelja (1. red) + cijeli opis',
  };

  const lines = payload.split('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 text-red-600">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Izvoz u SEPA EPC QR Kod
              </h2>
              <p className="text-xs text-slate-500">
                EPC060-08 europski standard za skeniranje mobilnim bankarstvom (Revolut, N26, domaće banke)
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main QR Display & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Live QR Canvas */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200">
                <canvas ref={canvasRef} className="max-w-[200px] w-full h-auto aspect-square" />
              </div>
              <span className="text-[11px] font-medium text-slate-500 mt-2.5 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                Spremno za skeniranje kamerom mobitela
              </span>

              <div className="flex items-center gap-2 mt-3 w-full">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Preuzmi PNG
                </button>
                <button
                  onClick={handleCopy}
                  className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Kopirano!' : 'Kopiraj kod'}
                </button>
              </div>
            </div>

            {/* Quick Details Card */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Iznos plaćanja:</span>
                  <span className="font-bold text-slate-900 text-base">
                    {formatEuro(document.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Primatelj:</span>
                  <span className="font-semibold text-slate-800 line-clamp-2">
                    {document.recipient.split('\n')[0] || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">IBAN:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {document.iban || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Poziv na broj (Strukturirana ref.):</span>
                  <span className="font-mono text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-block max-w-full truncate">
                    {structuredRef || '—'}
                  </span>
                </div>
              </div>

              {/* Revolut / International extension mode selector */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                    <Sliders className="w-3.5 h-3.5 text-amber-700" />
                    Revolut / Međunarodni mod proširenja
                  </label>
                  <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                    Mode {extMode}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-snug">
                  Revolut i neke inozemne banke ne prikazuju nestrukturirani opis plaćanja pa je korisno ugraditi opis ili ime u samu referencu (maksimalno 35 znakova).
                </p>

                <select
                  value={extMode}
                  onChange={(e) => setExtMode(e.target.value as RevolutExtMode)}
                  className="w-full text-xs bg-white border border-amber-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800 font-medium"
                >
                  <option value="0">0. Standardno (samo model + poziv)</option>
                  <option value="1">1. Dodaj 1. redak opisa plaćanja u referencu</option>
                  <option value="2">2. Dodaj pošiljatelja (1. red) + 1. redak opisa</option>
                  <option value="3">3. Dodaj samo pošiljatelja (1. red) u referencu</option>
                  <option value="4">4. Dodaj cijeli opis u referencu</option>
                  <option value="5">5. Dodaj pošiljatelja (1. red) + cijeli opis</option>
                </select>

                <div className="pt-1">
                  <label className="text-[11px] text-slate-600 block mb-1">
                    Prilagođeni sufiks / dodatak referenci:
                  </label>
                  <input
                    type="text"
                    value={customSuffix}
                    onChange={(e) => setCustomSuffix(e.target.value)}
                    placeholder="npr. stan 12, ref#44..."
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    maxLength={20}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Payload Line-by-Line Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                Točan sadržaj generiranog EPC SEPA zapisa:
              </span>
              <button
                onClick={handleCopy}
                className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
              >
                {copied ? 'Kopirano!' : 'Kopiraj sirovi tekst'}
              </button>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 text-[11px] font-mono leading-relaxed overflow-x-auto border border-slate-800">
              {lines.map((line, idx) => {
                const labels = [
                  'Usluga (Service)',
                  'Verzija (Version)',
                  'Kodiranje (Encoding)',
                  'Identifikacija (SCT)',
                  'BIC banke',
                  'Naziv primatelja (Beneficiary)',
                  'IBAN primatelja',
                  'Iznos plaćanja (Amount)',
                  'Šifra namjene (Purpose)',
                  'Strukturirana ref. (Revolut mod)',
                  'Tekstualni opis (Remittance)',
                  'Podaci platitelja (Information)',
                ];
                return (
                  <div key={idx} className="flex gap-3 hover:bg-slate-800/60 px-1 py-0.5 rounded">
                    <span className="text-slate-500 w-6 shrink-0 text-right">{idx + 1}</span>
                    <span className="text-slate-400 w-36 shrink-0 truncate">[{labels[idx] || `Polje ${idx + 1}`}]</span>
                    <span className={idx === 9 ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                      {line ? line : <span className="text-slate-600 italic">&lt;prazno&gt;</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Kompatibilno s EU SEPA Credit Transfer standardom.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            U redu
          </button>
        </div>
      </div>
    </div>
  );
};
