import React, { useState } from 'react';
import { CalendarClock, ChevronDown, Copy, Download, Layers, X } from 'lucide-react';

export function ExportMenu({ k, disabled, busy, onExcel, onCsv }) {
  const [open, setOpen] = useState(false);
  const pick = (fn) => () => {
    setOpen(false);
    fn();
  };
  return (
    <div className="bc-menu relative">
      <button
        type="button"
        className="aa-btn aa-btn--secondary aa-size-md inline-flex items-center gap-1.5 cursor-pointer"
        disabled={disabled || busy}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Download size={15} aria-hidden />
        <span>{k('export')}</span>
        <ChevronDown size={14} aria-hidden />
      </button>
      {open ? (
        <div className="bc-menu__list absolute right-0 top-full mt-1 min-w-[10rem] p-1 rounded-aa-lg border border-aa-line bg-aa-surface shadow-aa-modal z-20" role="menu">
          <button type="button" role="menuitem" className="w-full text-left px-3 py-2 text-sm text-aa-ink hover:bg-aa-surface-hover rounded-aa-sm transition-colors" onClick={pick(onExcel)}>
            Excel (.xlsx)
          </button>
          <button type="button" role="menuitem" className="w-full text-left px-3 py-2 text-sm text-aa-ink hover:bg-aa-surface-hover rounded-aa-sm transition-colors" onClick={pick(onCsv)}>
            CSV
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function BulkBar({ p }) {
  const { t, collections: c, actions: a } = p;
  const k = (key, opts) => t(`platform.billing.collections.${key}`, opts);
  if (!c.selectedIds.size) return null;
  return (
    <div className="bc-bulk flex flex-wrap items-center gap-2 p-2.5 rounded-aa-lg bg-aa-surface-sunken border border-aa-line my-2">
      <span className="bc-bulk__count text-xs font-semibold text-aa-ink">{k('bulk.selected', { count: c.selectedIds.size })}</span>
      <button type="button" className="aa-btn aa-btn--secondary aa-size-sm inline-flex items-center gap-1.5" onClick={a.copyBulkReminders}>
        <Copy size={14} aria-hidden />
        <span>{k('bulk.reminders')}</span>
      </button>
      <ExportMenu
        k={k}
        busy={a.exporting}
        onExcel={() => a.exportExcel(true)}
        onCsv={() => a.exportCsv(true)}
      />
      <button type="button" className="aa-btn aa-btn--secondary aa-size-sm inline-flex items-center gap-1.5" onClick={() => a.openBulk('plan')}>
        <Layers size={14} aria-hidden />
        <span>{k('bulk.changePlan')}</span>
      </button>
      <button type="button" className="aa-btn aa-btn--secondary aa-size-sm inline-flex items-center gap-1.5" onClick={() => a.openBulk('date')}>
        <CalendarClock size={14} aria-hidden />
        <span>{k('bulk.changeDate')}</span>
      </button>
      <button type="button" className="aa-btn aa-btn--ghost aa-size-sm inline-flex items-center gap-1.5" onClick={c.clearSelection}>
        <X size={14} aria-hidden />
        <span>{k('bulk.clear')}</span>
      </button>
    </div>
  );
}
