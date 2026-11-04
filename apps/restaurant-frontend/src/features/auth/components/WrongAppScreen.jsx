import { logoutAndResetSession } from '../../../utils/authSession';
import './wrong-app.css';

/** Opaque denial — no hint about the other product domain. */
export default function WrongAppScreen({ t }) {
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
          <button
            type="button"
            className="wrong-app__btn wrong-app__btn--primary"
            onClick={() => {
              logoutAndResetSession();
              window.location.assign('/login');
            }}
          >
            {t('login.signIn', { defaultValue: 'Войти' })}
          </button>
        </div>
      </div>
    </div>
  );
}
