import React, { useState } from 'react';
import { QrCode, Info, Shield } from 'lucide-react';
import { BaseModal, BaseButton } from '../../../../components/ui';

export default function PlatformSecurity2faModal({
  isOpen,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <BaseModal title="Ikki bosqichli tasdiqlash (2FA)" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            2FA (Google Authenticator) integratsiyasi backend servis tayyor bo‘lgach ishga tushiriladi.
          </span>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="w-24 h-24 bg-white dark:bg-slate-900 p-2 rounded-lg border flex items-center justify-center text-slate-400">
            <QrCode className="w-20 h-20 opacity-40" />
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-3">
            QR-kod va TOTP kaliti tez kunda taqdim etiladi
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          <BaseButton type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Yopish
          </BaseButton>
          <BaseButton
            type="button"
            className="flex-1 bg-slate-300 text-slate-500 cursor-not-allowed font-bold"
            disabled
          >
            <Shield className="w-3.5 h-3.5 mr-1" />
            Tez kunda
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
