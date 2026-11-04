import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isRestaurantAppSplitEnabled } from '../../config/restaurantAppUrl';
import '../../features/auth/components/wrong-app.css';

/**
 * /rst/* on aurent is retired — opaque message, no mention of the other domain.
 */
export default function RestaurantSpaHandoff() {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const split = isRestaurantAppSplitEnabled();

  useEffect(() => {
    if (!split) {
      console.warn('[aurent] VITE_RESTAURANT_APP_URL is empty');
    }
  }, [split]);

  if (!token) return null;

  return (
    <div className="wrong-app">
      <div className="wrong-app__card">
        <h1 className="wrong-app__title">
          {t('login.wrongAppTitle', { defaultValue: 'Ошибка входа' })}
        </h1>
        <p className="wrong-app__body">
          {t('login.wrongAppUnknown', { defaultValue: 'Нет такого аккаунта' })}
        </p>
        <div className="wrong-app__actions">
          <Link className="wrong-app__btn wrong-app__btn--primary" to="/login">
            {t('login.signIn', { defaultValue: 'Войти' })}
          </Link>
        </div>
      </div>
    </div>
  );
}
