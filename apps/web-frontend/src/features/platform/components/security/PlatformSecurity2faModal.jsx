import React, { useState } from 'react';
import { QrCode, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { BaseModal, BaseButton, BaseInput } from '../../../../components/ui';

export default function PlatformSecurity2faModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const secretKey = 'JBSW Y3DP EHPK 3PXP';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(secretKey.replace(/\s/g, ''));
    setCopied(true);
    toast.success('Kalit nusxalandi');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = (e) => {
    e.preventDefault();
    if (code.length < 6) {
      toast.error('6 xonali kodni to‘liq kiriting');
      return;
    }
    toast.success('2FA muvaffaqiyatli ulandi');
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <BaseModal title="Ikki bosqichli tasdiqlashni ulash" onClose={onClose} size="sm">
      <form onSubmit={handleFinish} className="space-y-4">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Super-admin hisoblari uchun 2FA majburiy. Google Authenticator yoki Authy ilovasidan foydalaning.
        </p>

        {/* QR Kod o'rni */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="w-32 h-32 bg-white p-2 rounded-lg border flex items-center justify-center text-slate-800">
            <QrCode className="w-28 h-28" />
          </div>
          <span className="text-[11px] text-slate-500 mt-2">Ilova orqali skanerlang</span>
        </div>

        {/* Secret kalit */}
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500">Skanerlay olmasangiz, kalitni qo‘lda kiriting:</span>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
            <span>{secretKey}</span>
            <button type="button" onClick={handleCopy} className="text-emerald-700 hover:text-emerald-800">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Kod kiritish */}
        <BaseInput
          label="Ilovadagi 6 xonali kod"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000 000"
          maxLength={6}
          required
        />

        <div className="flex gap-2 pt-2">
          <BaseButton type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Bekor qilish
          </BaseButton>
          <BaseButton
            type="submit"
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            disabled={code.length < 6}
          >
            Ulashni yakunlash
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}
