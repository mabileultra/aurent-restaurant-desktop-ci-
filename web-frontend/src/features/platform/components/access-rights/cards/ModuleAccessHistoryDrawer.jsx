import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RotateCcw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { platformModuleAccessApi } from '../../../../../api';
import { trapFocus } from '../utils/focusTrapUtils';

function formatWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function actionLabel(action, strategy) {
  if (action === 'COPY') return strategy === 'MERGE' ? 'Nusxa (MERGE)' : 'Nusxa (REPLACE)';
  if (action === 'BULK_RESET' || action === 'RESET') return 'Shablonga qaytarish';
  if (action === 'UPDATE') return 'Yangilash';
  if (action === 'REVERT') return 'Bekor qilish';
  return action || '—';
}

export default function ModuleAccessHistoryDrawer({ isOpen, onClose, currentLang = 'uz', onReverted }) {
  const queryClient = useQueryClient();
  const drawerRef = useRef(null);
  const closeRef = useRef(null);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['platform-module-access-history'],
    queryFn: () => platformModuleAccessApi.history({ page: 0, size: 50 }).then((r) => r.data),
    enabled: isOpen,
  });

  const rows = data?.content || [];

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      else if (e.key === 'Tab') trapFocus(e, drawerRef.current);
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleRevert = async (id) => {
    try {
      await platformModuleAccessApi.revertHistory(id);
      toast.success(currentLang === 'ru' ? 'Изменение отменено' : 'O‘zgarish bekor qilindi');
      queryClient.invalidateQueries({ queryKey: ['platform-module-access-history'] });
      queryClient.invalidateQueries({ queryKey: ['platform-module-access-stats'] });
      onReverted?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || (currentLang === 'ru' ? 'Не удалось отменить' : 'Bekor qilib bo‘lmadi'));
    }
  };

  if (!isOpen) return null;

  const title = currentLang === 'ru' ? 'История изменений' : 'O‘zgarishlar tarixi';
  const empty = currentLang === 'ru' ? 'Записей пока нет' : 'Hali yozuvlar yo‘q';

  const node = (
    <div
      ref={drawerRef}
      className="fixed inset-0 z-[110] flex justify-end bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="module-access-history-title"
    >
      <div className="flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 id="module-access-history-title" className="text-base font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          {isPending && (
            <div className="flex justify-center py-12 text-slate-400">
              <Loader2 className="animate-spin" size={22} />
            </div>
          )}
          {isError && (
            <button type="button" onClick={() => refetch()} className="text-sm text-rose-600 cursor-pointer">
              {currentLang === 'ru' ? 'Ошибка загрузки — повторить' : 'Yuklash xatosi — qayta urinish'}
            </button>
          )}
          {!isPending && !isError && rows.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">{empty}</p>
          )}
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {row.targetFullName || row.targetUsername || '—'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {actionLabel(row.action, row.strategy)} · {formatWhen(row.createdAt)}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentLang === 'ru' ? 'Оператор' : 'Operator'}: {row.actorName || '—'}
                  </p>
                </div>
                {row.canRevert && (
                  <button
                    type="button"
                    onClick={() => handleRevert(row.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 cursor-pointer shrink-0"
                  >
                    <RotateCcw size={12} />
                    {currentLang === 'ru' ? 'Отменить' : 'Bekor qilish'}
                  </button>
                )}
                {row.revertedAt && (
                  <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300 shrink-0">
                    {currentLang === 'ru' ? 'Отменено' : 'Bekor qilingan'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' && document.body ? createPortal(node, document.body) : node;
}
