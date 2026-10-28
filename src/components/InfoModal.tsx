import React, { useState } from 'react';
import { X, Search, HelpCircle, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PURPOSE_CODES } from '../data/purposeCodes';
import { PAYMENT_MODELS } from '../data/models';
import { ModelInfo, PurposeCodeInfo } from '../types/payment';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'purpose' | 'model';
  selectedCode?: string;
  onSelectCode?: (code: string) => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  type,
  selectedCode,
  onSelectCode,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Sve');

  if (!isOpen) return null;

  const isPurpose = type === 'purpose';

  const categories = ['Sve', ...Array.from(new Set(PURPOSE_CODES.map((p) => p.category)))];

  const filteredPurposeCodes = PURPOSE_CODES.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.definition.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Sve' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredModels = PAYMENT_MODELS.filter((item) => {
    return (
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.structure.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 text-red-600">
              {isPurpose ? <HelpCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isPurpose
                  ? 'Katalog šifri namjene (ISO 20022)'
                  : 'Katalog modela poziva na broj (FINA / HUB)'}
              </h2>
              <p className="text-xs text-slate-500">
                {isPurpose
                  ? 'Standardizirane četveroslovne šifre vrste plaćanja za tuzemni i SEPA promet'
                  : 'Pravila kontrole i strukture poziva na broj primatelja (HR00 - HR99)'}
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

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isPurpose ? 'Pretraži šifru, naziv ili opis (npr. plin, porez, plaća)...' : 'Pretraži model (npr. HR01, OIB, proračun)...'}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {isPurpose && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
          {isPurpose ? (
            filteredPurposeCodes.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Nije pronađena šifra za uneseni pojam.
              </div>
            ) : (
              filteredPurposeCodes.map((item) => {
                const isSelected = selectedCode === item.code;
                return (
                  <div
                    key={item.code}
                    className={`rounded-xl border p-3.5 transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-red-400 bg-red-50/80 shadow-xs ring-1 ring-red-400'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                          {item.code}
                        </span>
                        <span className="font-semibold text-slate-800 text-xs">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.2 rounded-full">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-snug">
                        {item.definition}
                      </p>
                    </div>

                    {onSelectCode && (
                      <button
                        onClick={() => {
                          onSelectCode(item.code);
                          onClose();
                        }}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600'
                        }`}
                      >
                        {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                        {isSelected ? 'Odabrano' : 'Odaberi šifru'}
                      </button>
                    )}
                  </div>
                );
              })
            )
          ) : filteredModels.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Nije pronađen model za uneseni pojam.
            </div>
          ) : (
            <>
              {/* Option for Blank Model (No model) */}
              <div
                className={`rounded-xl border p-4 transition space-y-2.5 ${
                  !selectedCode
                    ? 'border-red-400 bg-red-50/80 shadow-xs ring-1 ring-red-400'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-700 text-white">
                      Bez modela
                    </span>
                    <span className="font-bold text-slate-800 text-xs">
                      Slobodan unos poziva na broj (bez provjere)
                    </span>
                  </div>
                  {onSelectCode && (
                    <button
                      onClick={() => {
                        onSelectCode('');
                        onClose();
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                        !selectedCode
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600'
                      }`}
                    >
                      {!selectedCode ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                      {!selectedCode ? 'Odabrano' : 'Ukloni model'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  Omogućuje potpuno slobodan unos poziva na broj bez ikakve provjere kontrolnog broja i bez forsiranja crtica.
                </p>
              </div>

              {filteredModels.map((item) => {
                const isSelected = selectedCode === item.code;
                return (
                  <div
                    key={item.code}
                    className={`rounded-xl border p-4 transition space-y-2.5 ${
                      isSelected
                        ? 'border-red-400 bg-red-50/80 shadow-xs ring-1 ring-red-400'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-red-600 text-white">
                        {item.code}
                      </span>
                      <span className="font-bold text-slate-800 text-xs">
                        {item.name}
                      </span>
                    </div>
                    {onSelectCode && (
                      <button
                        onClick={() => {
                          onSelectCode(item.code);
                          onClose();
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600'
                        }`}
                      >
                        {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                        {isSelected ? 'Odabrano' : 'Odaberi model'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Struktura polja</span>
                      <span className="font-mono text-slate-700 font-semibold">{item.structure}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Modul kontrole</span>
                      <span className="text-slate-700">{item.controlModule || 'Standard'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">{item.description}</p>
                  <p className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded border border-amber-100">
                    {item.details}
                  </p>
                </div>
              );
            })}
          </>
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
