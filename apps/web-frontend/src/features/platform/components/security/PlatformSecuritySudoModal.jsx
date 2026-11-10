import React, { useState } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { BaseModal, BaseButton, BaseInput } from '../../../../components/ui';

export default function PlatformSecuritySudoModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}) {
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    await onConfirm?.({ password: password.trim(), totpCode: twoFactorCode.trim() || undefined });
    setPassword('');
    setTwoFactorCode('');
  };

  return (
    <BaseModal title="Shaxsingizni tasdiqlang" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Xavfli sozlamalarni saqlashdan oldin joriy parol (va 2FA yoqilgan bo‘lsa kod) talab qilinadi.
          </span>
        </div>

        <BaseInput
          label="Parolingiz"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Joriy super-admin paroli"
          autoFocus
        />

        <BaseInput
          label="Authenticator kodi (agar 2FA yoqilgan bo‘lsa)"
          type="text"
          value={twoFactorCode}
          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000 000"
          maxLength={6}
        />

        <div className="flex gap-2 pt-2">
          <BaseButton type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            Bekor qilish
          </BaseButton>
          <BaseButton
            type="submit"
            className="flex-1 font-bold"
            disabled={isSubmitting || !password.trim()}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            {isSubmitting ? 'Tekshirilmoqda…' : 'Tasdiqlash'}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}
