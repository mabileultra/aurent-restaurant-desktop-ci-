import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../store/authStore';
import { isPharmacyAppSplitEnabled } from '../../../config/pharmacyAppUrl';
import { redirectToPharmacyApp } from '../../../utils/pharmacyAppRedirect';
import { getPharmacyHandoffDrainBlock } from '../../../utils/pharmacyOfflineDrainGate';
import { PHARM_POS_PATH } from '../../../pharmacy/app/pharmacyPaths';
import '../../../styles/auth/auth-accept.css';

/**
 * Explicit entry: /auth/pharmacy-handoff?next=/pos
 * Requires session on aurent; exchanges for pharmacy SPA via one-time code.
 */
export default function PharmacyHandoffStartPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hydrated) return undefined;
    let cancelled = false;

    (async () => {
      if (!isPharmacyAppSplitEnabled()) {
        setError(t('pharmacyCashier.spaLaunchUnavailable', {
          defaultValue: 'Адрес аптечного приложения не настроен',
        }));
        return;
      }
      if (!token) {
        setError(t('pharmacyCashier.spaLaunchNeedLogin', {
          defaultValue: 'Сначала войдите на aurent.uz',
        }));
        return;
      }
      const drain = getPharmacyHandoffDrainBlock();
      if (drain.blocked) {
        setError(
          drain.reason === 'syncing'
            ? t('pharmacyCashier.spaLaunchWaitSync', {
              defaultValue: 'Дождитесь синхронизации офлайн-чеков, затем откройте новую аптеку',
            })
            : t('pharmacyCashier.spaLaunchDrainPending', {
              defaultValue: 'Сначала дождитесь выгрузки {{count}} офлайн-чека(ов) — иначе они останутся на aurent',
              count: drain.pending,
            }),
        );
        return;
      }
      try {
        const next = searchParams.get('next') || PHARM_POS_PATH;
        const started = await redirectToPharmacyApp(next);
        if (!started && !cancelled) {
          setError(t('pharmacyCashier.spaLaunchUnavailable', {
            defaultValue: 'Адрес аптечного приложения не настроен',
          }));
        }
      } catch {
        if (!cancelled) {
          setError(t('pharmacyCashier.spaLaunchFailed', {
            defaultValue: 'Не удалось открыть аптеку. Повторите вход.',
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, token, searchParams, t]);

  if (error) {
    return (
      <div className="auth-accept auth-accept__error">
        <p>{error}</p>
        <Link to={token ? PHARM_POS_PATH : '/login'}>
          {token
            ? t('pharmacyCashier.spaLaunchStay', { defaultValue: 'Остаться на /pharm' })
            : t('login.signIn', { defaultValue: 'Войти' })}
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-accept">
      {t('pharmacyCashier.spaLaunchBusy', { defaultValue: 'Открытие…' })}
    </div>
  );
}
