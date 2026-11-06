import React, { useState } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
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
    if (!password) return;
    onConfirm();
    setPassword('');
    setTwoFactorCode('');
  };

  return (
    <BaseModal title="Shaxsingizni tasdiqlang" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Kirish qoidalarini o‘zgartirish uchun parolingiz va mobil ilovadagi 6 xonali tasdiqlash kodi kerak.
        </p>

        <BaseInput
          label="Parolingiz"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Joriy super-admin paroli"
          required
        />

        <BaseInput
          label="Authenticator kodi"
          type="text"
          value={twoFactorCode}
          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Masalan, 849 201"
          maxLength={6}
        />

        <div className="flex gap-2 pt-2">
          <BaseButton type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Bekor qilish
          </BaseButton>
          <BaseButton
            type="submit"
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            disabled={!password}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Tasdiqlash va saqlash
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}
