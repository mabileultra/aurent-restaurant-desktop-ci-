import React, { useEffect } from 'react';
import { AlertCircle, Loader2, Send, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PlatformEmailConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  recipientCount,
  audienceLabel,
  subject,
  isSending,
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSending) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSending, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-send-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Send className="h-4 w-4" />
            </span>
            <h3 id="confirm-send-title" className="text-base font-bold text-slate-900 dark:text-white">
              {t('platform.email.confirmModal.title', 'Xat yuborishni tasdiqlash')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            aria-label={t('common.close', 'Yopish')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 py-4 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              {t('platform.email.confirmModal.recipientsCount', 'Qabul qiluvchilar soni')}
            </span>
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {recipientCount} ta qabul qiluvchi
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
              {t('platform.email.confirmModal.audience', 'Auditoriya')}
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {audienceLabel}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
              {t('platform.email.confirmModal.subject', 'Mavzu')}
            </span>
            <span className="font-bold text-slate-900 dark:text-white line-clamp-2">
              {subject || t('platform.email.noSubject', 'Mavzu kiritilmagan')}
            </span>
          </div>

          <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 pt-1">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              {t('platform.email.confirmModal.notice', 'Yuborish boshlangach, uni to‘xtatib bo‘lmaydi. Har bir foydalanuvchiga alohida xat jo‘natiladi.')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="h-10 rounded-xl border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            {t('platform.email.confirmModal.cancel', 'Bekor qilish')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSending || recipientCount === 0}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('platform.email.confirmModal.sending', 'Yuborilmoqda...')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t('platform.email.confirmModal.confirm', 'Tasdiqlash va yuborish')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
