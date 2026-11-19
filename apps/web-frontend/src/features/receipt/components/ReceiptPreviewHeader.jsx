import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Printer, Sliders } from 'lucide-react';
import { PAPER_WIDTH_58_MM, PAPER_WIDTH_80_MM } from '../constants/receiptPaperConstants';

export default function ReceiptPreviewHeader({
  paperWidthMm,
  setPaperWidthMm,
  showSettings,
  setShowSettings,
  onPrint,
  presets,
  selectedPresetId,
  setSelectedPresetId,
}) {
  return (
    <header className="sticky top-0 z-30 bg-slate-800/95 backdrop-blur border-b border-slate-700 px-4 py-3 print:hidden shadow-lg">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Bosh sahifaga qaytish"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-base font-bold text-white tracking-wide">
                Chek Jonli Ko‘rish (Receipt Live Preview)
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Soliq 26 band
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Soliq xizmati namunasi bo‘yicha chek ko‘rinishi va qatorlarini real vaqtda tekshirish
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="inline-flex rounded-lg bg-slate-700/70 p-1 border border-slate-600">
            <button
              type="button"
              onClick={() => setPaperWidthMm(PAPER_WIDTH_58_MM)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                paperWidthMm === PAPER_WIDTH_58_MM
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              58 mm (Tor lenta)
            </button>
            <button
              type="button"
              onClick={() => setPaperWidthMm(PAPER_WIDTH_80_MM)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                paperWidthMm === PAPER_WIDTH_80_MM
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              80 mm (Standart)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              showSettings
                ? 'bg-slate-700 border-slate-500 text-white'
                : 'bg-slate-800 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Sliders size={14} />
            <span>Shrift & Maydonlar</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition"
          >
            <Printer size={15} />
            <span>Chop etish (Print)</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-2.5 pt-2 border-t border-slate-700/60 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium whitespace-nowrap mr-1">Namuna turi:</span>
        {presets.map((preset) => {
          const isActive = preset.id === selectedPresetId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelectedPresetId(preset.id)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-transparent'
              }`}
            >
              {isActive ? <CheckCircle2 size={13} className="text-emerald-400" /> : null}
              <span>{preset.title}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
