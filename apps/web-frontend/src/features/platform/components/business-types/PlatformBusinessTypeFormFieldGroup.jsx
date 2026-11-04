export default function PlatformBusinessTypeFormFieldGroup({
  t,
  group,
  defs,
  byKey,
  onToggle,
  onSetGroup,
}) {
  const states = defs.map((def) => {
    const row = byKey[def.ruleKey];
    return row ? row.enabled !== false : true;
  });
  const allOn = states.length > 0 && states.every(Boolean);
  const allOff = states.length > 0 && states.every((v) => !v);

  return (
    <article className="business-constructor__form-group">
      <div className="business-constructor__form-group-head">
        <h4 className="business-constructor__form-group-title">{t(group.titleKey)}</h4>
        <div className="business-constructor__form-group-actions">
          <button
            type="button"
            className={`business-constructor__chip${allOn ? ' is-on' : ''}`}
            onClick={() => onSetGroup(defs.map((d) => d.ruleKey), true)}
          >
            {t('platform.businessTypes.formFieldsAllOn')}
          </button>
          <button
            type="button"
            className={`business-constructor__chip${allOff ? ' is-off' : ''}`}
            onClick={() => onSetGroup(defs.map((d) => d.ruleKey), false)}
          >
            {t('platform.businessTypes.formFieldsAllOff')}
          </button>
        </div>
      </div>
      <ul className="business-constructor__form-group-list">
        {defs.map((def) => {
          const row = byKey[def.ruleKey];
          const enabled = row ? row.enabled !== false : true;
          return (
            <li key={def.ruleKey}>
              <label className={`business-constructor__form-toggle${enabled ? ' is-on' : ''}`}>
                <span className="business-constructor__form-toggle-label">{t(def.labelKey)}</span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => onToggle(def.ruleKey)}
                />
                <span className="business-constructor__form-toggle-switch" aria-hidden />
              </label>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
