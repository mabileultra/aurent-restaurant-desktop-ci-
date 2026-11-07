import React, { useState } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { BaseModal, BaseButton, BaseInput } from '../../../../components/ui';

export default function PlatformSecuritySudoModal({
  isOpen,
  onClose,
  onConfirm,
}) {
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onClose();
  };

  return (
    <BaseModal title="Shaxsingizni tasdiqlang" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Qayta tasdiqlash xizmati backend integratsiyasi yakunlangach to‘liq ishga tushadi (Tez kunda).
          </span>
        </div>

        <BaseInput
          label="Parolingiz"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Joriy super-admin paroli"
          disabled
        />

        <BaseInput
          label="Authenticator kodi"
          type="text"
          value={twoFactorCode}
          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000 000"
          maxLength={6}
          disabled
        />

        <div className="flex gap-2 pt-2">
          <BaseButton type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Yopish
          </BaseButton>
          <BaseButton
            type="submit"
            className="flex-1 bg-slate-300 text-slate-500 cursor-not-allowed font-bold"
            disabled
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Tez kunda
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}
