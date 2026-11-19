/** Пароль PLU + последняя выгрузка + результат push по весам. */
export default function ScalesPluSyncExtras({
  t,
  desktop,
  password,
  onPasswordChange,
  onPasswordSave,
  lastSync,
  pushDevices,
}) {
  return (
    <>
      {desktop ? (
        <div className="scales-plu-sync__row scales-plu-sync__row--inline">
          <label className="scales-plu-sync__label" htmlFor="scales-password">
            {t('scales.passwordLabel')}
          </label>
          <div className="scales-plu-sync__password">
            <input
              id="scales-password"
              className="scales-plu-sync__select"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0030"
              autoComplete="off"
            />
            <button type="button" className="scales-btn scales-btn--ghost" onClick={onPasswordSave}>
              {t('scales.passwordSave')}
            </button>
          </div>
          <p className="scales-plu-sync__meta">{t('scales.passwordHint')}</p>
        </div>
      ) : null}

      {lastSync?.at ? (
        <p className="scales-plu-sync__stats">
          {t('scales.lastSync', {
            at: lastSync.at,
            count: lastSync.pushed ?? 0,
            devices: lastSync.devices ?? 0,
          })}
        </p>
      ) : null}

      {pushDevices?.length ? (
        <ul className="scales-plu-sync__devices">
          {pushDevices.map((d) => (
            <li key={`push-${d.host}:${d.udpPort}`} className={d.ok ? 'is-online' : 'is-offline'}>
              {(d.label ? `${d.label} · ` : '') + d.host + ':' + d.udpPort}
              {d.ok
                ? ` — ${t('scales.pushOk', { count: d.pushed || 0 })}`
                : ` — ${d.message || t('scales.pushFail')}`}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
