import React from 'react';
import { parseLeadTimeline } from '../../utils/leadFormatUtils';

export default function PlatformLeadConvertSidebar({ lead }) {
  if (!lead) return null;

  const timeline = parseLeadTimeline(lead.managerNote, lead);
  const lastComment = timeline.find((e) => e.type === 'comment')?.text || null;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs lg:col-span-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-white">{lead.name}</h3>
        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
          {lead.status}
        </span>
      </div>
      <p className="text-[11px] text-slate-400">{lead.leadType} · {lead.source}</p>
      <div className="space-y-2 border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800">
        <div>
          <span className="text-[11px] text-slate-400 block">Telefon:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{lead.phone}</span>
        </div>
        {lead.email && (
          <div>
            <span className="text-[11px] text-slate-400 block">Email:</span>
            <span className="text-slate-700 dark:text-slate-300">{lead.email}</span>
          </div>
        )}
        {lead.message && (
          <div className="rounded-xl bg-slate-50 p-2 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            {lead.message}
          </div>
        )}
        {lastComment && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-2 text-[11px] text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
            <span className="font-bold block">Oxirgi izoh:</span>
            {lastComment}
          </div>
        )}
      </div>
    </div>
  );
}
