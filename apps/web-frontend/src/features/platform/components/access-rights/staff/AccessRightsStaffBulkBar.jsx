import React from 'react';
import { RotateCcw, Copy, X, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseButton } from '../../../../../components/ui';

export default function AccessRightsStaffBulkBar({
  selectedCount = 0,
  isSameRole = true,
  onResetToTemplate,
  onApplyCopy,
  onClearSelection,
  isResetting = false,
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  if (selectedCount < 1) return null;

  const handleConfirmReset = () => {
    const confirmMsg = isRu
      ? `Сбросить ${selectedCount} выбранных сотрудников к шаблонам их ролей?`
      : `Tanlangan ${selectedCount} ta xodimni o‘z rol shablonlariga qaytarishni tasdiqlaysizmi?`;
    if (window.confirm(confirmMsg)) {
      onResetToTemplate();
    }
  };

  return (
    <div className="sticky bottom-2 z-10 p-3 rounded-xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 shadow-xl space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-emerald-400">
          {selectedCount} {isRu ? 'сотр. выбрано' : 'xodim tanlandi'}
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-slate-400 hover:text-white flex items-center gap-1 text-xs cursor-pointer"
        >
          <X size={13} />
          <span>{isRu ? 'Снять выбор' : 'Tanlovni bekor qilish'}</span>
        </button>
      </div>

      {!isSameRole && (
        <div className="flex items-center gap-1.5 text-xs text-amber-300">
          <AlertTriangle size={13} className="shrink-0" />
          <span>
            {isRu
              ? 'Выбраны разные роли. Копирование возможно только для одинаковых ролей.'
              : 'Rollar har xil. Nusxa faqat bir xil roldagi xodimlarga qo‘llanadi.'}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          disabled={isResetting}
          onClick={handleConfirmReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>{isRu ? 'Сбросить к шаблону' : 'Shablonga qaytarish'}</span>
        </button>

        <BaseButton
          variant="primary"
          size="sm"
          disabled={!isSameRole}
          onClick={onApplyCopy}
          className="text-xs font-semibold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50"
        >
          <Copy size={13} />
          <span>{isRu ? 'Применить копирование' : 'Huquqdan nusxa qo‘llash'}</span>
        </BaseButton>
      </div>
    </div>
  );
}
