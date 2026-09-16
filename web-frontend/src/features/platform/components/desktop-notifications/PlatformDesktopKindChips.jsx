const KIND_OPTIONS = [
  { value: 'MESSAGE', labelKey: 'platform.desktopNotifications.kindMessage' },
  { value: 'UPDATE', labelKey: 'platform.desktopNotifications.kindUpdate' },
  { value: 'ALERT', labelKey: 'platform.desktopNotifications.kindAlert' },
];

export default function PlatformDesktopKindChips({ t, kind, onKindChange }) {
  return (
    <div className="platform-desktop-kind" role="group" aria-label={t('platform.desktopNotifications.kind')}>
      {KIND_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`platform-desktop-kind__chip${kind === option.value ? ' is-active' : ''}`}
          onClick={() => onKindChange(option.value)}
        >
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  );
}
