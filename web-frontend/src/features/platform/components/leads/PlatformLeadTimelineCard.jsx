import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { parseLeadTimeline, formatLeadDateTime } from '../../utils/leadFormatUtils';

function dotColorClass(type) {
  if (type === 'created') return 'bg-slate-400';
  if (type === 'status_change') return 'bg-blue-500';
  return 'bg-emerald-500';
}

export default function PlatformLeadTimelineCard({
  lead,
  onAddComment,
  isSaving,
  t,
  isMobile = false,
}) {
  const [commentText, setCommentText] = useState('');

  if (!lead) return null;

  const timeline = parseLeadTimeline(lead.managerNote, lead);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const text = commentText.trim();
    if (!text || isSaving) return;
    onAddComment(text);
    setCommentText('');
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900/90">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
        {t ? t('platform.leads.commentsAndHistory', { defaultValue: 'Izohlar va tarix' }) : 'Izohlar va tarix'}
      </h3>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={t ? t('platform.leads.commentPh', { defaultValue: 'Masalan: qo\'ng\'iroq qildim, ertaga demo kelishildi' }) : 'Masalan: qo\'ng\'iroq qildim, ertaga demo kelishildi'}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        {isMobile ? (
          <button
            type="submit"
            disabled={!commentText.trim() || isSaving}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white transition-opacity disabled:opacity-40 dark:bg-white dark:text-slate-900 cursor-pointer"
          >
            <Send size={14} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!commentText.trim() || isSaving}
            className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-opacity disabled:opacity-40 dark:bg-white dark:text-slate-900 cursor-pointer"
          >
            {t ? t('platform.leads.addComment', { defaultValue: 'Izoh qo\'shish' }) : 'Izoh qo\'shish'}
          </button>
        )}
      </form>

      {/* Timeline items list */}
      <div className="relative space-y-3.5 pt-2">
        {timeline.map((item) => (
          <div key={item.id} className="relative flex items-start gap-2.5 text-xs">
            {/* Colored dot */}
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColorClass(item.type)}`}
              aria-hidden="true"
            />
            {/* Content & Author */}
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="font-medium text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                {item.text}
              </p>
              <p className="text-[11px] text-slate-400">
                {item.author} · {formatLeadDateTime(item.at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
