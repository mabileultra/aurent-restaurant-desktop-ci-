import React, { useState } from 'react';
import { RotateCcw, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseButton } from '../../../../../components/ui';

export default function AccessRightsHistoryItemCard({
  item,
  onRevert,
  isReverting = false,
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const [showDetails, setShowDetails] = useState(false);

  const typeBadges = {
    template: {
      label: isRu ? 'Шаблон' : 'Shablon',
      cls: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
    },
    exception: {
      label: isRu ? 'Исключение' : 'Istisno',
      cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    },
    copy: {
      label: isRu ? 'Копия' : 'Nusxa',
      cls: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    },
    bulk: {
      label: isRu ? 'Массово' : 'Ommaviy',
      cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    },
    revert: {
      label: isRu ? 'Отмена' : 'Qaytarish',
      cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    },
  };

  const actionType = item.actionType || 'exception';
  const badgeInfo = typeBadges[actionType] || typeBadges.exception;
  const isReverted = Boolean(item.revertedAt);
  const canRevert = Boolean(item.canRevert) && !isReverted;

  const handleRevertClick = () => {
    const confirmMsg = isRu
      ? 'Действительно отменить это действие и вернуть предыдущее состояние прав?'
      : 'Ushbu amalni bekor qilib, avvalgi huquqlarni tiklashni tasdiqlaysizmi?';
    if (window.confirm(confirmMsg)) {
      onRevert(item.id);
    }
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 shrink-0 mt-0.5 sm:mt-0">
            {item.time || '12:00'}
          </span>

          <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
            {item.operatorInitials || 'Po'}
          </span>

          <div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
              {item.title || (isRu ? 'Оператор изменил доступ' : 'Platforma operatori o‘zgartirish kiritdi')}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${badgeInfo.cls}`}>
                {badgeInfo.label}
              </span>
              <span>{item.subtitle || (isRu ? '1 сотр.' : '1 xodim')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setShowDetails((p) => !p)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <span>{isRu ? 'Детали' : 'Tafsilot'}</span>
            {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {isReverted ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <CheckCircle2 size={12} className="text-slate-400" />
              <span>{isRu ? 'Откачено' : 'Bekor qilingan'}</span>
            </span>
          ) : (
            <BaseButton
              variant="secondary"
              size="sm"
              disabled={isReverting || !canRevert}
              onClick={handleRevertClick}
              className="text-xs font-semibold gap-1.5 text-slate-700 dark:text-slate-200"
            >
              <RotateCcw size={12} />
              <span>{isRu ? 'Откатить' : 'Qaytarish'}</span>
            </BaseButton>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
          <div className="font-bold text-slate-700 dark:text-slate-300">
            {isRu ? 'Детали изменений:' : 'O‘zgarishlar tafsiloti:'}
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-mono text-xs">
            {item.details || (isRu ? 'Права модулей обновлены' : 'Modul ruxsatlari yangilandi')}
          </p>
        </div>
      )}
    </div>
  );
}
