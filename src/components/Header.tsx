import React, { useState } from 'react';
import {
  QrCode,
  Download,
  Upload,
  FileSpreadsheet,
  DownloadCloud,
  Wifi,
  WifiOff,
  Plus,
  Share2,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HeaderProps {
  onOpenCsvBatch: () => void;
  onExportSessionJson: () => void;
  onImportSessionJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenCatalog: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCsvBatch,
  onExportSessionJson,
  onImportSessionJson,
  onOpenCatalog,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-sm ring-2 ring-red-100">
              <span className="font-black text-lg tracking-tight">€</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  HUB3 & SEPA Nalozi
                </h1>
                <span className="text-[10px] font-bold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200 hidden sm:inline-block">
                  PWA Offline
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Interaktivni generator i skener platnih naloga (PDF417 + EPC QR)
              </p>
            </div>
          </div>

          {/* Action Tools & PWA Controls */}
          <div className="flex items-center gap-2">
            {/* Online / Offline Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-300 animate-pulse'
              }`}
              title={isOnline ? 'Povezani ste na mrežu (podaci se spremaju lokalno)' : 'Izvanmrežni rad (Offline) - svi alati rade neovisno'}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {isOnline ? 'Online / Lokalno spremljeno' : 'Offline način'}
              </span>
            </div>

            {/* Catalog Info */}
            <button
              onClick={onOpenCatalog}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
              title="Pregled šifri namjene i modela poziva na broj"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Katalog šifri i modela</span>
            </button>

            {/* CSV / TSV Batch Modal Trigger */}
            <button
              onClick={onOpenCsvBatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Serijski uvoz ili izvoz CSV / TSV tablice"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV / Tablica</span>
            </button>

            {/* Session JSON Controls */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                onClick={onExportSessionJson}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                title="Izvezi cjelokupnu sesiju u JSON datoteku"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden lg:inline">Izvoz sesije</span>
              </button>

              <label
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                title="Uvezi prethodno spremljenu JSON sesiju"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden lg:inline">Uvoz sesije</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={onImportSessionJson}
                  className="hidden"
                />
              </label>
            </div>

            {/* PWA Install Button */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-red-400" />
                Instaliraj PWA
              </button>
            )}

            {!isInstalled && isIOS && (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                Instaliraj na iOS
              </button>
            )}
          </div>
        </div>
      </div>

      {/* iOS Safari Guided Install Sheet */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Instalacija na iPhone / iPad
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Za instalaciju ove aplikacije za samostalni izvanmrežni (offline) rad:
              <br />
              1. Dodirnite gumb <strong>Dijeli (Share)</strong> na traci Safarija.
              <br />
              2. Pomaknite se prema dolje i odaberite <strong>Dodaj na početni zaslon (Add to Home Screen)</strong>.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Razumijem
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
