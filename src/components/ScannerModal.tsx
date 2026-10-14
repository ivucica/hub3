import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import {
  Camera,
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { parseScannedHub3, parseScannedSepaQr } from '../utils/paymentUtils';
import { PaymentDocument } from '../types/payment';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedFormat: 'HUB3' | 'SEPA' | 'ANY';
  onApplyData: (data: Partial<PaymentDocument>) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  expectedFormat,
  onApplyData,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'file' | 'raw'>('camera');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<{
    text: string;
    format: string;
    parsed: Partial<PaymentDocument> | null;
  } | null>(null);
  const [rawInput, setRawInput] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Initialize hints
  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.PDF_417,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.CODE_128,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    codeReaderRef.current = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 250 });

    return () => {
      stopCamera();
    };
  }, []);

  // Fetch camera devices when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setErrorMessage(null);
      return;
    }

    if (activeTab === 'camera') {
      loadCameras();
    }
  }, [isOpen, activeTab]);

  const loadCameras = async () => {
    try {
      setErrorMessage(null);
      const devices = await navigator.mediaDevices?.enumerateDevices();
      const videoInputs = devices?.filter(d => d.kind === 'videoinput') || [];
      setVideoDevices(videoInputs);

      if (videoInputs.length > 0) {
        // Prefer back camera on mobile
        const backCam = videoInputs.find(d => /back|environment|stražnja/i.test(d.label));
        const defaultId = backCam?.deviceId || videoInputs[0].deviceId;
        setSelectedDeviceId(defaultId);
        startScanning(defaultId);
      } else {
        // Attempt requesting permission first
        const stream = await navigator.mediaDevices?.getUserMedia({ video: true });
        stream?.getTracks().forEach(t => t.stop());
        const refreshed = await navigator.mediaDevices?.enumerateDevices();
        const refreshedInputs = refreshed?.filter(d => d.kind === 'videoinput') || [];
        setVideoDevices(refreshedInputs);
        if (refreshedInputs.length > 0) {
          setSelectedDeviceId(refreshedInputs[0].deviceId);
          startScanning(refreshedInputs[0].deviceId);
        } else {
          setErrorMessage('Nije pronađena dostupna kamera.');
        }
      }
    } catch (err: unknown) {
      console.warn('Camera enumeration error:', err);
      setErrorMessage('Pristup kameri nije omogućen. Provjerite dozvole preglednika ili prenesite sliku barkoda.');
    }
  };

  const startScanning = async (deviceId: string) => {
    stopCamera();
    if (!videoRef.current || !codeReaderRef.current) return;

    setIsScanning(true);
    setErrorMessage(null);

    try {
      const controls = await codeReaderRef.current.decodeFromVideoDevice(
        deviceId || undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            handleDetectedCode(result.getText(), result.getBarcodeFormat().toString());
          }
        }
      );
      controlsRef.current = controls;
    } catch (err) {
      console.error('Error starting video decode:', err);
      setIsScanning(false);
      setErrorMessage('Neuspješno pokretanje kamere. Molimo odaberite drugu kameru ili učitajte datoteku.');
    }
  };

  const stopCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setIsScanning(false);
  };

  const handleDetectedCode = (text: string, formatName = 'Nepoznato') => {
    let parsed: Partial<PaymentDocument> | null = null;

    if (text.startsWith('HRVHUB30')) {
      parsed = parseScannedHub3(text);
    } else if (text.startsWith('BCD\n002') || text.includes('SCT')) {
      parsed = parseScannedSepaQr(text);
    } else {
      // Try generic parse
      parsed = parseScannedHub3(text) || parseScannedSepaQr(text);
    }

    setScannedResult({
      text,
      format: formatName,
      parsed,
    });

    // Provide subtle audio feedback / haptic if available
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !codeReaderRef.current) return;

    setErrorMessage(null);
    setScannedResult(null);

    const imageUrl = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = imageUrl;
      img.onload = async () => {
        try {
          const result = await codeReaderRef.current!.decodeFromImageElement(img);
          if (result) {
            handleDetectedCode(result.getText(), result.getBarcodeFormat().toString());
          } else {
            setErrorMessage('Barkod nije prepoznat na učitanoj slici. Provjerite oštrinu i osvjetljenje.');
          }
        } catch (scanErr) {
          setErrorMessage('Barkod (PDF417 ili QR kod) nije pronađen na slici.');
        } finally {
          URL.revokeObjectURL(imageUrl);
        }
      };
    } catch (err) {
      setErrorMessage('Greška pri učitavanju datoteke.');
      URL.revokeObjectURL(imageUrl);
    }
  };

  const handleApply = () => {
    if (scannedResult?.parsed) {
      onApplyData(scannedResult.parsed);
      onClose();
    }
  };

  const handleRawSubmit = () => {
    if (!rawInput.trim()) return;
    handleDetectedCode(rawInput.trim(), 'Tekstualni unos');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-red-600" />
              {expectedFormat === 'HUB3'
                ? 'Skeniraj HUB-3 (PDF417) kod'
                : expectedFormat === 'SEPA'
                ? 'Skeniraj SEPA EPC QR kod'
                : 'Skeniraj barkod ili QR kod'}
            </h2>
            <p className="text-xs text-slate-500">
              Očitani podaci automatski će zamijeniti trenutni platni nalog
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => {
              setActiveTab('camera');
              if (selectedDeviceId) startScanning(selectedDeviceId);
            }}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'camera'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            Kamera
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('file');
            }}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'file'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            Učitaj sliku
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('raw');
            }}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'raw'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Tekst / Sirovi unos
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {/* Camera selection & restart */}
              {videoDevices.length > 1 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-600">Odabir kamere:</label>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => {
                      setSelectedDeviceId(e.target.value);
                      startScanning(e.target.value);
                    }}
                    className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    {videoDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Kamera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => startScanning(selectedDeviceId)}
                    className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 transition"
                    title="Ponovno pokreni kameru"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Video viewport */}
              <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* Targeting viewfinder overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className={`w-3/4 h-3/5 border-2 rounded-xl transition-all duration-300 relative ${
                    scannedResult ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500/80 animate-pulse'
                  }`}>
                    {/* Corner marks */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-red-500" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-red-500" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-red-500" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-red-500" />

                    <div className="absolute inset-x-0 bottom-2 text-center">
                      <span className="text-[11px] font-medium bg-black/60 text-white px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                        Postavite kod unutar okvira
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-8 hover:border-red-500 hover:bg-red-50/30 transition cursor-pointer group">
                <Upload className="w-10 h-10 text-slate-400 group-hover:text-red-500 transition mb-3" />
                <span className="text-sm font-semibold text-slate-700">
                  Kliknite za prijenos slike uplatnice ili koda
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Podržani formati: PNG, JPG, WEBP, PDF screenshot
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700">
                Zalijepite sirovi sadržaj barkoda (HRVHUB30... ili BCD...):
              </label>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                rows={6}
                placeholder="HRVHUB30&#10;EUR&#10;00000000002450&#10;PETAR HORVAT&#10;..."
                className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none bg-slate-50"
              />
              <button
                onClick={handleRawSubmit}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
              >
                Obradi i analiziraj kod
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success / Parsed Result Preview */}
          {scannedResult && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Kod uspješno očitan!
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                  {scannedResult.format}
                </span>
              </div>

              {scannedResult.parsed ? (
                <div className="grid grid-cols-2 gap-2 text-xs bg-white rounded-lg p-3 border border-emerald-100 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Iznos</span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {scannedResult.parsed.amount?.toFixed(2)} €
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">IBAN Primatelja</span>
                    <span className="font-mono text-slate-800 truncate block">
                      {scannedResult.parsed.iban || '—'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase">Primatelj</span>
                    <span className="font-medium text-slate-800 whitespace-pre-line text-xs">
                      {scannedResult.parsed.recipient || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Model i Poziv na broj</span>
                    <span className="font-mono font-medium text-slate-800">
                      {scannedResult.parsed.model} {scannedResult.parsed.pnb}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Šifra namjene</span>
                    <span className="font-mono text-slate-800">
                      {scannedResult.parsed.purposeCode || 'Nije zadana'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase">Opis plaćanja</span>
                    <span className="text-slate-800 italic">
                      {scannedResult.parsed.description || '—'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-600 break-all max-h-24 overflow-y-auto">
                  {scannedResult.text}
                </div>
              )}

              <button
                onClick={handleApply}
                disabled={!scannedResult.parsed}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Primijeni i zamijeni podatke u obrascu
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
};
