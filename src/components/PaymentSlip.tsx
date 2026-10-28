import React, { useRef, useState, useEffect } from 'react';
import {
  HelpCircle,
  QrCode,
  Scan,
  Download,
  Printer,
  ChevronDown,
  Info,
  Calendar,
  Layers,
  ArrowRightLeft,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { PaymentDocument } from '../types/payment';
import { PAYMENT_MODELS } from '../data/models';
import { PURPOSE_CODES } from '../data/purposeCodes';
import {
  buildHub3Payload,
  cleanAmount,
  formatEuro,
  formatSlipAmount,
} from '../utils/paymentUtils';
import { renderHub3Barcode, downloadCanvasAsPng } from '../utils/barcodeGenerator';
import { validatePnb } from '../utils/pnbValidator';

interface PaymentSlipProps {
  document: PaymentDocument;
  onChange: (updated: PaymentDocument) => void;
  onOpenScanner: (format: 'HUB3' | 'SEPA') => void;
  onOpenSepaExport: () => void;
  onOpenInfo: (type: 'purpose' | 'model', code?: string) => void;
}

export const PaymentSlip: React.FC<PaymentSlipProps> = ({
  document,
  onChange,
  onOpenScanner,
  onOpenSepaExport,
  onOpenInfo,
}) => {
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [slipVariant, setSlipVariant] = useState<'HUB3A' | 'HUB3'>('HUB3A');
  const [barcodeRenderError, setBarcodeRenderError] = useState<string | null>(null);

  const hub3Payload = buildHub3Payload(document);

  // Live render PDF417 whenever document changes
  useEffect(() => {
    if (barcodeCanvasRef.current) {
      try {
        setBarcodeRenderError(null);
        renderHub3Barcode(barcodeCanvasRef.current, hub3Payload, { scale: 2, columns: 9 });
      } catch (err) {
        console.warn('PDF417 barcode render warning:', err);
        setBarcodeRenderError('Greška pri generiranju barkoda');
      }
    }
  }, [hub3Payload]);

  const handleFieldChange = (field: keyof PaymentDocument, value: any) => {
    onChange({
      ...document,
      [field]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAmountChange = (raw: string) => {
    const num = cleanAmount(raw);
    handleFieldChange('amount', num);
  };

  // Find current model info and purpose code info for 1-liner descriptions
  const currentModelInfo = document.model
    ? PAYMENT_MODELS.find((m) => m.code.toUpperCase() === document.model.toUpperCase())
    : undefined;

  const pnbValidation = validatePnb(document.model, document.pnb);

  const currentPurposeInfo = PURPOSE_CODES.find(
    (p) => p.code.toUpperCase() === (document.purposeCode || '').toUpperCase()
  );

  const handleDownloadBarcode = () => {
    if (!barcodeCanvasRef.current) return;
    const cleanFileName = (document.filename || 'hub3_barkod')
      .replace(/\.[^/.]+$/, '')
      .replace(/\s+/g, '_');
    downloadCanvasAsPng(barcodeCanvasRef.current, `${cleanFileName}_hub3_pdf417.png`);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Action Bar Above Slip */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Vrsta obrasca:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setSlipVariant('HUB3A')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                slipVariant === 'HUB3A'
                  ? 'bg-white text-red-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              HUB 3A (s talonom i 2D kodom)
            </button>
            <button
              onClick={() => setSlipVariant('HUB3')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                slipVariant === 'HUB3'
                  ? 'bg-white text-red-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              HUB 3 (Univerzalni nalog)
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenScanner('HUB3')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Skeniraj HUB-3 uplatnicu ili barkod kamerom"
          >
            <Scan className="w-3.5 h-3.5" />
            Zamijeni iz HUB-3 koda
          </button>

          <button
            onClick={() => onOpenScanner('SEPA')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Skeniraj SEPA EPC QR kod kamerom"
          >
            <QrCode className="w-3.5 h-3.5" />
            Zamijeni iz QR koda
          </button>

          <button
            onClick={onOpenSepaExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            Izvezi u QR kod (SEPA)
          </button>

          <button
            onClick={handlePrintSlip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Ispiši nalog za plaćanje na pisač ili u PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            Ispiši nalog
          </button>
        </div>
      </div>

      {/* THE OFFICIAL CROATIAN HUB-3A PAYMENT SLIP */}
      <div className="payment-slip-container overflow-x-auto pb-4">
        <div className="min-w-[900px] bg-[#fffaf5] border-2 border-red-600 rounded-xl shadow-lg print:border-red-600 print:shadow-none print:w-full print:rounded-none overflow-hidden relative">
          
          {/* Slip Outer Grid Layout: Main Left Section (HUB 3A) + Right Section (Talon 60mm) */}
          <div className="grid grid-cols-12 divide-x-2 divide-red-500 divide-dashed">
            
            {/* LEFT SECTION (Main Order 150mm equivalent) */}
            <div className="col-span-8 p-4 flex flex-col justify-between space-y-3">
              
              {/* Slip Header */}
              <div className="flex items-center justify-between border-b border-red-300 pb-2">
                <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
                  {slipVariant === 'HUB3A' ? 'Obr. HUB 3A' : 'Obr. HUB 3'}
                </span>
                <h1 className="text-base font-black tracking-widest text-red-600 uppercase">
                  {slipVariant === 'HUB3A' ? 'NALOG ZA NACIONALNA PLAĆANJA' : 'UNIVERZALNI NALOG ZA PLAĆANJE'}
                </h1>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-red-800 bg-red-100/70 px-2 py-0.5 rounded border border-red-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!document.isUrgent}
                      onChange={(e) => handleFieldChange('isUrgent', e.target.checked)}
                      className="accent-red-600 h-3.5 w-3.5 rounded"
                    />
                    HITNO
                  </label>
                </div>
              </div>

              {/* Row 1: Valuta i Iznos */}
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-7">
                  <label className="text-[10px] font-bold uppercase text-red-700 block tracking-tight">
                    PLATITELJ (naziv/ime, ulica i mjesto):
                  </label>
                  <textarea
                    rows={3}
                    value={document.payer}
                    onChange={(e) => handleFieldChange('payer', e.target.value)}
                    placeholder="Ime i prezime / Naziv tvrtke&#10;Ulica i kućni broj&#10;Poštanski broj i grad"
                    className="w-full text-xs font-medium p-1.5 bg-white border border-red-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none resize-none leading-tight"
                  />
                </div>

                <div className="col-span-5 space-y-1.5">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-red-700 block">
                        Valuta:
                      </label>
                      <div className="bg-red-50 border border-red-400 text-center font-bold text-red-900 py-1.5 rounded text-xs">
                        EUR
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold uppercase text-red-700 block flex items-center justify-between">
                        <span>Iznos:</span>
                        <span className="text-[9px] text-red-600 font-normal">(= ili *)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={document.amount ? document.amount.toString().replace('.', ',') : ''}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          placeholder="0,00"
                          className="w-full text-right font-mono font-bold text-slate-900 text-sm px-2 py-1 bg-white border border-red-400 rounded focus:ring-1 focus:ring-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-red-700 block">
                      IBAN ili broj računa platitelja:
                    </label>
                    <input
                      type="text"
                      value={document.invoiceNumber?.startsWith('HR') ? document.invoiceNumber : ''}
                      onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                      placeholder="HR___________________ (neobavezno za gotovinu)"
                      className="w-full text-xs font-mono px-2 py-1 bg-white border border-red-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Primatelj */}
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-7">
                  <label className="text-[10px] font-bold uppercase text-red-700 block tracking-tight">
                    PRIMATELJ (naziv/ime, ulica i mjesto):
                  </label>
                  <textarea
                    rows={3}
                    value={document.recipient}
                    onChange={(e) => handleFieldChange('recipient', e.target.value)}
                    placeholder="Naziv primatelja (tvrtka / osoba)&#10;Ulica i kućni broj&#10;Poštanski broj i grad"
                    className="w-full text-xs font-medium p-1.5 bg-white border border-red-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none resize-none leading-tight"
                  />
                </div>

                <div className="col-span-5 space-y-1.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-red-700 block flex items-center justify-between">
                      <span>IBAN primatelja (obavezno):</span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {document.iban ? `${document.iban.replace(/\s+/g, '').length}/21 zn.` : '0/21'}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={document.iban}
                      onChange={(e) => handleFieldChange('iban', e.target.value.toUpperCase())}
                      placeholder="HR7124020061100662212"
                      className="w-full text-xs font-mono font-bold tracking-wider text-slate-900 px-2 py-1 bg-white border-2 border-red-400 rounded focus:ring-1 focus:ring-red-500 focus:outline-none uppercase"
                    />
                  </div>

                  {/* Model & Poziv na broj */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-red-700 block">
                        Model i Poziv na broj primatelja:
                      </label>
                      <button
                        type="button"
                        onClick={() => onOpenInfo('model', document.model)}
                        className="text-[10px] text-red-600 hover:text-red-800 font-semibold flex items-center gap-0.5 cursor-pointer no-print"
                      >
                        <HelpCircle className="w-3 h-3" />
                        Pomoć o modelima
                      </button>
                    </div>

                    <div className="grid grid-cols-12 gap-1.5">
                      {/* Model Selector with 1-liner description */}
                      <div className="col-span-4 relative">
                        <select
                          value={document.model || ''}
                          onChange={(e) => handleFieldChange('model', e.target.value)}
                          className="w-full text-xs font-mono font-bold bg-white border border-red-400 rounded px-1.5 py-1 focus:ring-1 focus:ring-red-500 focus:outline-none"
                        >
                          <option value="">(Bez modela)</option>
                          {PAYMENT_MODELS.map((m) => (
                            <option key={m.code} value={m.code}>
                              {m.code} - {m.name.slice(0, 16)}...
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Poziv na broj */}
                      <div className="col-span-8">
                        <input
                          type="text"
                          value={document.pnb}
                          onChange={(e) => handleFieldChange('pnb', e.target.value)}
                          placeholder="12345-67890-01"
                          className={`w-full text-xs font-mono font-semibold px-2 py-1 bg-white rounded focus:ring-1 focus:outline-none ${
                            pnbValidation.severity === 'control_warning'
                              ? 'border-2 border-amber-500 bg-amber-50/30 focus:ring-amber-500'
                              : 'border border-red-400 focus:ring-red-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* 1-liner description for Model */}
                    {currentModelInfo ? (
                      <div className="text-[10px] text-slate-600 truncate mt-0.5 flex items-center justify-between">
                        <span className="truncate">
                          <strong className="text-red-700">{currentModelInfo.code}:</strong> {currentModelInfo.description}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenInfo('model', currentModelInfo.code)}
                          className="text-red-600 underline text-[9px] shrink-0 ml-1 no-print cursor-pointer"
                        >
                          više
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        <span className="text-slate-700 font-medium">Bez modela:</span> slobodan unos, bez kontrole i bez nametanja crtica.
                      </div>
                    )}

                    {/* PNB Validation Status & Warnings */}
                    {document.pnb && (
                      <div className="mt-1.5 space-y-1">
                        {pnbValidation.severity === 'control_warning' && (
                          <div className="p-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-[11px] space-y-1 shadow-2xs">
                            <div className="flex items-start gap-1.5 font-bold text-amber-900">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                              <span>{pnbValidation.title}</span>
                            </div>
                            <p className="text-[10px] text-amber-900 leading-snug">
                              {pnbValidation.message}
                            </p>
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/80 text-[10px]">
                              <span className="text-amber-800 italic">
                                * Ne blokira izvoz ni provođenje naloga.
                              </span>
                              {pnbValidation.suggestedPnb && (
                                <button
                                  type="button"
                                  onClick={() => handleFieldChange('pnb', pnbValidation.suggestedPnb!)}
                                  className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold cursor-pointer transition shadow-2xs"
                                >
                                  Ispravi u: {pnbValidation.suggestedPnb}
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {pnbValidation.severity === 'dash_info' && (
                          <div className="flex items-start gap-1.5 px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-900 text-[10px] leading-tight">
                            <Info className="w-3.5 h-3.5 shrink-0 text-blue-600 mt-0.5" />
                            <span>{pnbValidation.message}</span>
                          </div>
                        )}

                        {pnbValidation.severity === 'ok' && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{pnbValidation.message}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: Šifra Namjene i Opis Plaćanja */}
              <div className="grid grid-cols-12 gap-3 items-start">
                {/* Šifra namjene */}
                <div className="col-span-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-red-700 block">
                      Šifra namjene:
                    </label>
                    <button
                      type="button"
                      onClick={() => onOpenInfo('purpose', document.purposeCode)}
                      className="text-[10px] text-red-600 hover:text-red-800 font-semibold flex items-center gap-0.5 cursor-pointer no-print"
                    >
                      <HelpCircle className="w-3 h-3" />
                      Katalog šifri
                    </button>
                  </div>

                  <select
                    value={document.purposeCode || ''}
                    onChange={(e) => handleFieldChange('purposeCode', e.target.value)}
                    className="w-full text-xs font-mono font-semibold bg-white border border-red-300 rounded px-2 py-1 focus:ring-1 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="">(Nije odabrana)</option>
                    {PURPOSE_CODES.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>

                  {/* 1-liner description for Purpose */}
                  {currentPurposeInfo ? (
                    <div className="text-[10px] text-slate-600 truncate mt-0.5 flex items-center justify-between">
                      <span>
                        <strong className="text-red-700">{currentPurposeInfo.code}:</strong> {currentPurposeInfo.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenInfo('purpose', currentPurposeInfo.code)}
                        className="text-red-600 underline text-[9px] shrink-0 ml-1 no-print cursor-pointer"
                      >
                        detalji
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic">
                      Neobavezno polje (npr. GASB, WTER, ELEC, COST...)
                    </div>
                  )}

                  <div className="pt-1">
                    <label className="text-[10px] font-bold uppercase text-red-700 block">
                      Datum izvršenja / Dospijeće:
                    </label>
                    <input
                      type="text"
                      value={document.dueDate}
                      onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                      placeholder="dd.mm.gggg"
                      className="w-full text-xs font-medium px-2 py-1 bg-white border border-red-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Opis plaćanja */}
                <div className="col-span-8 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-red-700 block">
                      Opis plaćanja (do 4 retka x 35 znakova):
                    </label>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {document.description ? document.description.length : 0} zn.
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={document.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Obračun potrošnje plina / broj računa / dospijeće..."
                    className="w-full text-xs font-medium p-1.5 bg-white border border-red-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Bottom Section: 2D Barcode (PDF417) + Pečat / Potpis */}
              <div className="grid grid-cols-12 gap-3 pt-2 border-t border-red-300 items-end">
                {/* PDF417 2D Barkod Zone */}
                <div className="col-span-7">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase text-red-800 flex items-center gap-1">
                      2D Bar code (HUB-3 standard):
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadBarcode}
                      className="text-[10px] text-red-700 hover:text-red-900 font-semibold flex items-center gap-0.5 cursor-pointer no-print"
                      title="Preuzmi sliku PDF417 barkoda"
                    >
                      <Download className="w-3 h-3" />
                      Preuzmi PNG
                    </button>
                  </div>

                  {/* Canvas Container */}
                  <div className="p-2 bg-white rounded-lg border border-red-300 shadow-2xs flex items-center justify-center min-h-[90px]">
                    <canvas
                      ref={barcodeCanvasRef}
                      className="max-w-full h-auto object-contain"
                    />
                  </div>
                  {barcodeRenderError && (
                    <span className="text-[10px] text-amber-700 font-medium">{barcodeRenderError}</span>
                  )}
                </div>

                {/* Pečat i potpis */}
                <div className="col-span-5 grid grid-cols-2 gap-2 text-center">
                  <div className="h-20 border border-red-300 rounded bg-red-50/30 flex items-end justify-center pb-1">
                    <span className="text-[9px] text-red-600 uppercase font-medium">
                      Pečat korisnika PU
                    </span>
                  </div>
                  <div className="h-20 border border-red-300 rounded bg-red-50/30 flex items-end justify-center pb-1">
                    <span className="text-[9px] text-red-600 uppercase font-medium">
                      Potpis korisnika PU
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT SECTION (TALON / POTVRDA O UPLATI - 60mm) */}
            <div className="col-span-4 p-4 bg-[#fffdfa] flex flex-col justify-between space-y-3">
              <div className="border-b border-red-300 pb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-black text-red-600 uppercase tracking-wider">
                  POTVRDA O UPLATI (TALON)
                </span>
                <span className="text-[9px] text-slate-400 font-mono">HUB 3A</span>
              </div>

              {/* Talon: Valuta i Iznos */}
              <div className="bg-red-50/70 p-2 rounded border border-red-300">
                <span className="text-[9px] font-bold uppercase text-red-700 block">
                  Valuta i iznos:
                </span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  EUR {formatSlipAmount(document.amount)}
                </span>
              </div>

              {/* Talon: Platitelj */}
              <div>
                <span className="text-[9px] font-bold uppercase text-red-700 block">
                  Platitelj:
                </span>
                <div className="text-[11px] text-slate-800 leading-tight whitespace-pre-line p-1.5 bg-white border border-red-200 rounded min-h-[40px]">
                  {document.payer || <span className="text-slate-400 italic">Nije upisano</span>}
                </div>
              </div>

              {/* Talon: Primatelj & IBAN */}
              <div>
                <span className="text-[9px] font-bold uppercase text-red-700 block">
                  IBAN i Primatelj:
                </span>
                <div className="p-1.5 bg-white border border-red-200 rounded space-y-1">
                  <div className="font-mono font-bold text-slate-900 text-[11px] truncate">
                    {document.iban || <span className="text-slate-400 italic">HR...</span>}
                  </div>
                  <div className="text-[10px] text-slate-700 line-clamp-2 leading-tight">
                    {document.recipient.split('\n')[0] || '—'}
                  </div>
                </div>
              </div>

              {/* Talon: Model i Poziv na broj primatelja */}
              <div>
                <span className="text-[9px] font-bold uppercase text-red-700 block">
                  Model i poziv na broj primatelja:
                </span>
                <div className="font-mono font-bold text-slate-800 text-xs p-1.5 bg-white border border-red-200 rounded truncate">
                  {document.model ? `${document.model} ` : ''}{document.pnb || '—'}
                </div>
              </div>

              {/* Talon: Opis plaćanja */}
              <div>
                <span className="text-[9px] font-bold uppercase text-red-700 block">
                  Opis plaćanja:
                </span>
                <div className="text-[10px] text-slate-700 italic p-1.5 bg-white border border-red-200 rounded line-clamp-3 leading-tight min-h-[36px]">
                  {document.description || '—'}
                </div>
              </div>

              {/* Talon: Ovjera */}
              <div className="pt-2 border-t border-red-300">
                <div className="h-16 border border-red-300 rounded bg-red-50/30 flex items-end justify-center pb-1 text-center">
                  <span className="text-[9px] text-red-600 uppercase font-medium">
                    Ovjera (primitak banke / pošte)
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
