import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { clampNum } from './labelLayoutUtils';
import ShelfLabelNumField from './ShelfLabelNumField';

export default function ShelfLabelFineTuneSection({ layout, patchLayout, t }) {
  const [fineOpen, setFineOpen] = useState(false);
  const fineSectionRef = useRef(null);

  useEffect(() => {
    if (!fineOpen || !fineSectionRef.current) return;
    fineSectionRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [fineOpen]);

  return (
    <>
      <button
        type="button"
        className="mt-4 flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        onClick={() => setFineOpen((v) => !v)}
        aria-expanded={fineOpen}
      >
        {t('usersBarcodePrint.fineSettings', { defaultValue: 'Тонкая настройка' })}
        {fineOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {fineOpen ? (
        <div
          ref={fineSectionRef}
          className="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-700"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-700 dark:text-slate-200">
              {t('usersBarcodePrint.textScale', { defaultValue: 'Размер текста' })}
            </span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.8"
                max="1.6"
                step="0.02"
                value={layout.fontScale}
                onChange={(e) => patchLayout({ fontScale: clampNum(e.target.value, 0.8, 1.6) })}
              />
              <span className="w-12 text-right font-mono text-sm text-slate-600 dark:text-slate-300">
                {Number(layout.fontScale).toFixed(2)}
              </span>
            </div>
          </div>
          <ShelfLabelNumField
            label={t('usersBarcodePrint.pageMargin', { defaultValue: 'Поля @page (мм)' })}
            value={layout.pageMarginMm}
            min={0}
            max={10}
            step={0.5}
            className="w-24"
            onChange={(pageMarginMm) => patchLayout({ pageMarginMm })}
          />
        </div>
      ) : null}
    </>
  );
}
