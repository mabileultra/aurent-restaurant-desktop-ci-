import React from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';
import { BaseModal, BaseButton } from '../../../../components/ui';

export default function PlatformSecurityCloseSessionModal({
  isOpen,
  session,
  isCloseAll,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <BaseModal
      title={isCloseAll ? 'Barcha boshqa seanslarni yopasizmi?' : 'Bu seansni yopasizmi?'}
      onClose={onClose}
      size="sm"
    >
      <div className="space-y-4">
        {session && !isCloseAll ? (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="font-bold text-slate-900 dark:text-slate-100">{session.device}</div>
            <div className="text-slate-600 dark:text-slate-400">{session.who}</div>
            <div className="font-mono text-slate-500">{session.where}</div>
          </div>
        ) : null}

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>
            {isCloseAll
              ? 'Barcha boshqa qurilmalardagi faol seanslar darhol to‘xtatiladi. Qayta kirish uchun qaytadan tizimga kirish talab etiladi.'
              : 'Xodim darhol tizimdan chiqariladi. Saqlanmagan o‘zgarishlari yo‘qolishi mumkin. Qayta kirish uchun parolini yana kiritishi kerak bo‘ladi.'}
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          <BaseButton type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Bekor qilish
          </BaseButton>
          <BaseButton
            type="button"
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold"
            onClick={onConfirm}
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Seansni yopish
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
