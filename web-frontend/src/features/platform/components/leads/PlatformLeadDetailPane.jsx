import React, { useState } from 'react';
import { Building2, Trash2 } from 'lucide-react';
import PlatformLeadQuickActionsBar from './PlatformLeadQuickActionsBar';
import PlatformLeadTimelineCard from './PlatformLeadTimelineCard';
import PlatformLeadDeleteConfirmModal from './PlatformLeadDeleteConfirmModal';
import {
  formatLeadDateTime,
  formatPreferredTime,
  formatLeadType,
  formatLeadSource,
  formatLeadStatus,
} from '../../utils/leadFormatUtils';

const STATUS_OPTIONS = [
  { key: 'NEW', labelKey: 'platform.leads.statuses.NEW', fallback: 'Yangi', activeCls: 'bg-blue-600 text-white' },
  { key: 'IN_PROGRESS', labelKey: 'platform.leads.statuses.IN_PROGRESS', fallback: 'Jarayonda', activeCls: 'bg-amber-600 text-white' },
  { key: 'DONE', labelKey: 'platform.leads.statuses.DONE', fallback: 'Yakunlangan', activeCls: 'bg-emerald-600 text-white' },
  { key: 'REJECTED', labelKey: 'platform.leads.statuses.REJECTED', fallback: 'Rad etilgan', activeCls: 'bg-rose-600 text-white' },
];

export default function PlatformLeadDetailPane({
  lead,
  hasLeads = true,
  t,
  onStatusChange,
  onAddComment,
  onConvertToCompany,
  onDeleteLead,
  isSaving,
  isDeleting,
}) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (!lead) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
        {hasLeads
          ? (t ? t('platform.leads.selectLead', { defaultValue: 'Arizani tanlang' }) : 'Arizani tanlang')
          : (t ? t('platform.leads.noLeadsToDisplay', { defaultValue: 'Ko\'rsatish uchun ariza mavjud emas' }) : 'Ko\'rsatish uchun ariza mavjud emas')}
      </div>
    );
  }

  const localeDisplay = lead.locale === 'uz' ? 'O\'zbekcha' : lead.locale === 'ru' ? 'Ruscha' : (lead.locale || '—');
  const typeLabel = formatLeadType(lead.leadType);
  const sourceLabel = formatLeadSource(lead.source);
  const statusLabel = formatLeadStatus(lead.status);
  const canConvert = lead.status !== 'DONE' && lead.status !== 'REJECTED' && ['CONNECT', 'DEMO'].includes(lead.leadType);

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* 1. Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {lead.name}
          </h2>
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
            {statusLabel}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          {typeLabel} · {sourceLabel} · {formatLeadDateTime(lead.createdAt)}
        </p>
      </div>

      {/* 2. Quick Actions */}
      <PlatformLeadQuickActionsBar lead={lead} t={t} />

      {/* 3. Details Grid */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl bg-slate-50/80 p-3.5 text-xs sm:grid-cols-2 dark:bg-slate-800/50">
        <div>
          <span className="block text-[11px] font-semibold text-slate-400">Telefon</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{lead.phone}</span>
        </div>
        <div>
          <span className="block text-[11px] font-semibold text-slate-400">Email</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">{lead.email || '—'}</span>
        </div>
        <div>
          <span className="block text-[11px] font-semibold text-slate-400">Qulay vaqt</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">{formatPreferredTime(lead.preferredTime)}</span>
        </div>
        <div>
          <span className="block text-[11px] font-semibold text-slate-400">Til</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">{localeDisplay}</span>
        </div>
        {lead.message && (
          <div className="sm:col-span-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="block text-[11px] font-semibold text-slate-400">Xabar</span>
            <p className="mt-0.5 text-slate-800 dark:text-slate-200">{lead.message}</p>
          </div>
        )}
      </div>

      {/* 4. Status Segments + Convert to Company */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Holat</span>
          {canConvert && (
            <button
              type="button"
              onClick={() => onConvertToCompany(lead)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 cursor-pointer"
            >
              <Building2 size={14} />
              <span>Kompaniyaga aylantirish</span>
            </button>
          )}
        </div>

        {/* 4 Segment Buttons */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STATUS_OPTIONS.map((opt) => {
            const isCurrent = lead.status === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={isCurrent}
                onClick={() => onStatusChange(lead.id, opt.key)}
                disabled={isSaving}
                className={`rounded-xl border py-2 text-xs font-bold transition-all cursor-pointer ${
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
      </div>

      {/* 5. Timeline & Comments */}
      <PlatformLeadTimelineCard lead={lead} onAddComment={onAddComment} isSaving={isSaving} t={t} />

      {/* 6. Delete Action */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={() => setDeleteConfirmOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer"
        >
          <Trash2 size={13} />
          <span>Arizani o'chirish</span>
        </button>
      </div>

      <PlatformLeadDeleteConfirmModal
        isOpen={deleteConfirmOpen}
        leadName={lead.name}
        isDeleting={isDeleting}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          onDeleteLead(lead.id);
        }}
      />
    </div>
  );
}
