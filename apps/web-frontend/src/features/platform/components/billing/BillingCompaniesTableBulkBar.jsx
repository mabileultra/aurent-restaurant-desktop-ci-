import React, { useState } from 'react';
import { CalendarClock, ChevronDown, Copy, Download, Layers, X } from 'lucide-react';

export function ExportMenu({ k, disabled, busy, onExcel, onCsv }) {
  const [open, setOpen] = useState(false);
  const pick = (fn) => () => {
    setOpen(false);
    fn();
  };
  return (
    <div className="bc-menu">
      <button
        type="button"
        className="bc-btn bc-btn--outline"
        disabled={disabled || busy}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Download size={15} aria-hidden />
        {k('export')}
        <ChevronDown size={14} aria-hidden />
      </button>
      {open ? (
        <div className="bc-menu__list" role="menu">
          <button type="button" role="menuitem" onClick={pick(onExcel)}>
            Excel (.xlsx)
          </button>
          <button type="button" role="menuitem" onClick={pick(onCsv)}>
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
    <div className="bc-bulk">
      <span className="bc-bulk__count">{k('bulk.selected', { count: c.selectedIds.size })}</span>
      <button type="button" className="bc-btn bc-btn--outline" onClick={a.copyBulkReminders}>
        <Copy size={15} aria-hidden />
        {k('bulk.reminders')}
      </button>
      <ExportMenu
        k={k}
        busy={a.exporting}
        onExcel={() => a.exportExcel(true)}
        onCsv={() => a.exportCsv(true)}
      />
      <button type="button" className="bc-btn bc-btn--outline" onClick={() => a.openBulk('plan')}>
        <Layers size={15} aria-hidden />
        {k('bulk.changePlan')}
      </button>
      <button type="button" className="bc-btn bc-btn--outline" onClick={() => a.openBulk('date')}>
        <CalendarClock size={15} aria-hidden />
        {k('bulk.changeDate')}
      </button>
      <button type="button" className="bc-btn bc-btn--ghost" onClick={c.clearSelection}>
        <X size={15} aria-hidden />
        {k('bulk.clear')}
      </button>
    </div>
  );
}
