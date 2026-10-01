import { pinRoleBadgeClass, pinRoleLabel, staffInitial } from '../../utils/pinRosterRoles';

export default function CashierPinLoginRoster({
  t,
  roster,
  loading,
  error,
  onSelect,
  onRetry,
  onAdmin,
}) {
  const count = roster.length;
  const title = t('cashierLogin.whoWorking', {
    count,
    defaultValue: 'Кто работает? ({{count}})',
  });

  return (
    <div className="cashier-pin-roster__body">
      <h1 className="cashier-pin-roster__title">{title}</h1>

      {loading ? (
        <p className="cashier-pin-roster__status">
          {t('common.loading', { defaultValue: 'Загрузка…' })}
        </p>
      ) : null}

      {!loading && error ? (
        <div className="cashier-pin-roster__status cashier-pin-roster__status--error">
          <p>{error}</p>
          <button type="button" className="cashier-pin-roster__retry" onClick={onRetry}>
            {t('common.retry', { defaultValue: 'Повторить' })}
          </button>
        </div>
      ) : null}

      {!loading && !error && count === 0 ? (
        <p className="cashier-pin-roster__status">
          {t('cashierLogin.rosterEmpty', {
            defaultValue: 'Нет сотрудников с PIN. Выдайте PIN менеджеру, кассиру, официанту или повару в штате.',
          })}
        </p>
      ) : null}

      {!loading && !error ? (
        <ul className="cashier-pin-roster__grid">
          {roster.map((staff) => (
            <li key={staff.id}>
              <button
                type="button"
                className="cashier-pin-roster__card"
                onClick={() => onSelect(staff)}
              >
                <span className="cashier-pin-roster__avatar" aria-hidden="true">
                  {staffInitial(staff.displayName)}
                </span>
                <span className="cashier-pin-roster__name">{staff.displayName}</span>
                <span className={`cashier-pin-roster__badge ${pinRoleBadgeClass(staff.role)}`}>
                  {pinRoleLabel(staff.role, t)}
                </span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="cashier-pin-roster__card cashier-pin-roster__card--admin"
              onClick={onAdmin}
            >
              <span className="cashier-pin-roster__avatar cashier-pin-roster__avatar--admin" aria-hidden="true">
                A
              </span>
              <span className="cashier-pin-roster__name">
                {t('cashierLogin.adminCard', { defaultValue: 'Админка' })}
              </span>
              <span className="cashier-pin-roster__badge is-admin">
                {t('cashierLogin.adminBadge', { defaultValue: 'Логин / пароль' })}
              </span>
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
