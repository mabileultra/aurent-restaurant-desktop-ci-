import React from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import PlatformLeadQuickActionsBar from './PlatformLeadQuickActionsBar';
import PlatformLeadTimelineCard from './PlatformLeadTimelineCard';
import {
  formatLeadDateTime,
  formatPreferredTime,
  formatLeadType,
  formatLeadSource,
  formatLeadStatus,
  getLeadWaitUrgency,
} from '../../utils/leadFormatUtils';

const MOBILE_STATUS_OPTIONS = [
  { key: 'NEW', labelKey: 'platform.leads.statuses.NEW', fallback: 'Yangi', activeCls: 'bg-blue-600 text-white' },
  { key: 'IN_PROGRESS', labelKey: 'platform.leads.statuses.IN_PROGRESS', fallback: 'Jarayonda', activeCls: 'bg-amber-600 text-white' },
  { key: 'DONE', labelKey: 'platform.leads.statuses.DONE', fallback: 'Yakunlangan', activeCls: 'bg-emerald-600 text-white' },
  { key: 'REJECTED', labelKey: 'platform.leads.statuses.REJECTED', fallback: 'Rad etilgan', activeCls: 'bg-rose-600 text-white' },
];

export default function PlatformLeadMobileDetailView({
  lead,
  onBack,
  onStatusChange,
  onAddComment,
  onConvertToCompany,
  isSaving,
  t,
}) {
  if (!lead) return null;

  const urgency = getLeadWaitUrgency(lead);
  const localeDisplay = lead.locale === 'uz' ? 'O\'zbekcha' : lead.locale === 'ru' ? 'Ruscha' : (lead.locale || '—');
  const typeLabel = formatLeadType(lead.leadType);
  const sourceLabel = formatLeadSource(lead.source);
  const statusLabel = formatLeadStatus(lead.status);
  const canConvert = lead.status !== 'DONE' && lead.status !== 'REJECTED' && ['CONNECT', 'DEMO'].includes(lead.leadType);

  return (
    <div className="space-y-3.5 pb-8">
      {/* 1. Header with back button */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-start gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="mt-0.5 rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-slate-900 dark:text-white">
              {lead.name}
            </h2>
            <p className="text-[11px] text-slate-400">
              {typeLabel} · {sourceLabel} · {formatLeadDateTime(lead.createdAt)}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
          {statusLabel}
        </span>
      </div>

      {/* 2. Urgency wait banner */}
      {urgency.waitText && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs font-bold text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-200">
          {urgency.waitText}
        </div>
      )}

      {/* 3. Quick Actions Bar */}
      <PlatformLeadQuickActionsBar lead={lead} t={t} isMobile={true} />

      {/* 4. Message Card */}
      {lead.message && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 shadow-2xs">
          {lead.message}
        </div>
      )}

      {/* 5. Info Grid */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-800/50">
        <div>
          <span className="block text-[11px] font-semibold text-slate-400">Qulay vaqt</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">{formatPreferredTime(lead.preferredTime)}</span>
        </div>
        <div>
          <span className="block text-[11px] font-semibold text-slate-400">Til</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">{localeDisplay}</span>
        </div>
      </div>

      {/* 6. Holat Segment (2x2 grid) */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Holat</span>
        <div className="grid grid-cols-2 gap-2">
          {MOBILE_STATUS_OPTIONS.map((opt) => {
            const isCurrent = lead.status === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={isCurrent}
                onClick={() => onStatusChange(lead.id, opt.key)}
                disabled={isSaving}
                className={`rounded-xl border py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? `${opt.activeCls} border-transparent shadow-xs`
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                {t ? t(opt.labelKey, { defaultValue: opt.fallback }) : opt.fallback}
              </button>
            );
          })}
        </div>

        {/* Convert to Company Button */}
        {canConvert && (
          <button
            type="button"
            onClick={() => onConvertToCompany(lead)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 cursor-pointer"
          >
            <Building2 size={15} />
            <span>Kompaniyaga aylantirish</span>
          </button>
        )}
      </div>

      {/* 7. Timeline Card */}
      <PlatformLeadTimelineCard
        lead={lead}
        onAddComment={onAddComment}
        isSaving={isSaving}
        t={t}
        isMobile={true}
      />
    </div>
  );
}
