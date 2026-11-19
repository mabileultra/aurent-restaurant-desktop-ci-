import React from 'react';
import { ThermalPrintSettingsPanel } from '../../../components/receipt';

export default function ReceiptPreviewSidebar({ activePreset, showSettings }) {
  return (
    <div className="w-full md:w-80 space-y-4 print:hidden order-2 md:order-1 shrink-0">
      <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center justify-between">
          <span>{activePreset.title}</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
            {activePreset.badge}
          </span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {activePreset.description}
        </p>
      </div>

      {showSettings ? (
        <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-4">
          <ThermalPrintSettingsPanel />
        </div>
      ) : null}

      <div className="rounded-xl bg-slate-800/50 border border-slate-700/70 p-4 text-xs text-slate-300 space-y-2">
        <h4 className="font-semibold uppercase tracking-wider text-[11px] text-emerald-400">
          Soliq tekshiruvi (26 band):
        </h4>
        <ul className="space-y-1 text-slate-300 pl-1">
          <li>✓ 1-3: Korxona, Manzil, STIR/JSHSHIR</li>
          <li>✓ 4-7: Sana, Vaqt (soniyalar), №Chek, Kassir, Smena</li>
          <li>✓ 8-11: Tovar nomi, kg/dona, QQS 12% va summasi</li>
          <li>✓ 12-15: MXIK, ShT.kod, MK markirovka, Komitent</li>
          <li>✓ 16-17: JAMI va jami QQS 12%</li>
          <li>✓ 18-21: To‘lov shakli, Karta toifasi, Karta raqami (ijtimoiy), RRN</li>
          <li>✓ 22-26: Chek turi, Virtual kassa, FM, Fiskal belgi, Soliq QR</li>
        </ul>
      </div>
    </div>
  );
}
