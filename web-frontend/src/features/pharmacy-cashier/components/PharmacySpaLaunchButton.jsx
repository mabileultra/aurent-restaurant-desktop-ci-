import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ExternalLink } from 'lucide-react';
import { isPharmacyAppSplitEnabled } from '../../../config/pharmacyAppUrl';
import { redirectToPharmacyApp } from '../../../utils/pharmacyAppRedirect';
import '../styles/pharmacy-spa-launch.css';

/**
 * Explicit handoff to p-aurent (one-time Identity code). No silent hop — /pharm stays until cutover.
 */
export default function PharmacySpaLaunchButton({ className = '', compact = false }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [busy, setBusy] = useState(false);

  if (!isPharmacyAppSplitEnabled()) return null;

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const started = await redirectToPharmacyApp(location.pathname);
      if (!started) {
        toast.error(t('pharmacyCashier.spaLaunchUnavailable', {
          defaultValue: 'Адрес аптечного приложения не настроен',
        }));
        setBusy(false);
      }
    } catch {
      toast.error(t('pharmacyCashier.spaLaunchFailed', {
        defaultValue: 'Не удалось открыть аптеку. Повторите вход.',
      }));
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`pharmacy-spa-launch ${compact ? 'pharmacy-spa-launch--compact' : ''} ${className}`.trim()}
      onClick={onClick}
      disabled={busy}
      title={t('pharmacyCashier.spaLaunchTitle', { defaultValue: 'Открыть новую аптеку (p-aurent)' })}
    >
      <ExternalLink size={compact ? 14 : 16} strokeWidth={2.25} aria-hidden />
      {!compact ? (
        <span>
          {busy
            ? t('pharmacyCashier.spaLaunchBusy', { defaultValue: 'Открытие…' })
            : t('pharmacyCashier.spaLaunch', { defaultValue: 'Новая аптека' })}
        </span>
      ) : null}
    </button>
  );
}
