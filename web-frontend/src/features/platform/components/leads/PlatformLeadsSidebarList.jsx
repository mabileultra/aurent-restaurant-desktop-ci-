import React from 'react';
import { formatLeadRelativeTime, getLeadWaitUrgency } from '../../utils/leadFormatUtils';

function statusBadgeClass(status) {
  switch (status) {
    case 'NEW':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60';
    case 'IN_PROGRESS':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60';
    case 'DONE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
}

function urgencyBadgeClass(level) {
  if (level === 'danger') {
    return 'bg-rose-100 text-rose-800 border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60';
  }
  if (level === 'warning') {
    return 'bg-amber-100 text-amber-800 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60';
  }
  return 'bg-sky-100 text-sky-800 border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60';
}

export default function PlatformLeadsSidebarList({
  leads = [],
  selectedId,
  onSelectLead,
  t,
  isPending,
}) {
  if (isPending) {
    return (
      <div className="space-y-2.5 p-4 text-center text-xs text-slate-500">
        <p>{t ? t('common.loading') : 'Yuklanmoqda…'}</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
        {t ? t('common.noData') : 'Arizalar topilmadi'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {leads.map((lead) => {
        const isSelected = lead.id === selectedId;
        const urgency = getLeadWaitUrgency(lead);
        const relativeTime = formatLeadRelativeTime(lead.createdAt);

        return (
          <div
            key={lead.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectLead(lead)}
            onKeyDown={(e) => e.key === 'Enter' && onSelectLead(lead)}
            className={`group relative flex flex-col gap-2 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
              isSelected
                ? 'border-emerald-500 bg-emerald-50/40 shadow-xs dark:border-emerald-500/80 dark:bg-emerald-950/20'
                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-2xs dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700'
            }`}
          >
            {/* Top row: Name + Unread indicator + Relative time */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {lead.status === 'NEW' && (
                  <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" aria-label="Yangi" />
                )}
                <h4 className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {lead.name}
                </h4>
              </div>
              <span className="shrink-0 text-[11px] font-medium text-slate-400">
                {relativeTime}
              </span>
            </div>

            {/* Badges: Type + Source + Status */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              {lead.leadType && (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {t ? t(`platform.leads.types.${lead.leadType}`, { defaultValue: lead.leadType }) : lead.leadType}
                </span>
              )}
              {lead.source && (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {t ? t(`platform.leads.sources.${lead.source}`, { defaultValue: lead.source }) : lead.source}
                </span>
              )}
              {lead.status && (
                <span className={`rounded-md border px-1.5 py-0.5 font-semibold ${statusBadgeClass(lead.status)}`}>
                  {t ? t(`platform.leads.statuses.${lead.status}`, { defaultValue: lead.status }) : lead.status}
                </span>
              )}
            </div>

            {/* Message snippet */}
            {lead.message && (
              <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                {lead.message}
              </p>
            )}

            {/* Unanswered wait tag */}
            {urgency.waitText && (
              <div className="pt-0.5">
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${urgencyBadgeClass(urgency.level)}`}>
                  {urgency.waitText}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
