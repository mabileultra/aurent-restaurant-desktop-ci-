import React, { useEffect, useState } from 'react';
import { QrCode, Info, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { BaseModal, BaseButton, BaseInput } from '../../../../components/ui';
import { platformSecurityApi } from '../../../../api';

export default function PlatformSecurity2faModal({
  isOpen,
  onClose,
}) {
  const [secret, setSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const setup = await platformSecurityApi.setupTwoFactor().then((r) => r.data);
        if (cancelled) return;
        setSecret(setup.secret || '');
        setOtpauthUrl(setup.otpauthUrl || '');
        setEnabled(Boolean(setup.enabled));
        if (setup.otpauthUrl) {
          const url = await QRCode.toDataURL(setup.otpauthUrl, { width: 180, margin: 1 });
          if (!cancelled) setQrDataUrl(url);
        }
      } catch (e) {
        toast.error(e.response?.data?.message ?? '2FA sozlamasini yuklab bo‘lmadi');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnable = async () => {
    try {
      setLoading(true);
      const res = await platformSecurityApi.enableTwoFactor(code).then((r) => r.data);
      setEnabled(Boolean(res.enabled));
      toast.success('2FA yoqildi');
      onClose?.();
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Kod noto‘g‘ri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal title="Ikki bosqichli tasdiqlash (2FA)" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Google Authenticator yoki boshqa TOTP ilovasida QR-kodni skanerlang, keyin 6 xonali kodni kiriting.
          </span>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="2FA QR" className="w-40 h-40 rounded-lg border bg-white" />
          ) : (
            <div className="w-24 h-24 bg-white dark:bg-slate-900 p-2 rounded-lg border flex items-center justify-center text-slate-400">
              <QrCode className="w-20 h-20 opacity-40" />
            </div>
          )}
          {secret ? (
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 mt-3 break-all text-center">
              {secret}
            </span>
          ) : null}
          {otpauthUrl && !qrDataUrl ? (
            <span className="text-xs text-slate-500 mt-2">QR yuklanmoqda…</span>
          ) : null}
        </div>

        {!enabled ? (
          <BaseInput
            label="Authenticator kodi"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
          />
        ) : null}

        <div className="flex gap-2 pt-2">
          <BaseButton type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Yopish
          </BaseButton>
          {!enabled ? (
            <BaseButton
              type="button"
              className="flex-1 font-bold"
              disabled={loading || code.length < 6}
              onClick={handleEnable}
            >
              <Shield className="w-3.5 h-3.5 mr-1" />
              Yoqish
            </BaseButton>
          ) : null}
        </div>
      </div>
    </BaseModal>
  );
}
