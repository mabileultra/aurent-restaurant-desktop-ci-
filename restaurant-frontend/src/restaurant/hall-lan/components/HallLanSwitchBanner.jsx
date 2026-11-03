import { useTranslation } from 'react-i18next';
import '../styles/hall-lan-switch-banner.css';

export default function HallLanSwitchBanner({
  primaryHref,
  lanHubUrls = [],
  onDismiss,
}) {
  const { t } = useTranslation();
  const hasUrl = Boolean(primaryHref);

  return (
    <div className="rst-hall-lan-banner" role="status">
      <p className="rst-hall-lan-banner__text">
        <span className="rst-hall-lan-banner__title">
          {t('rst.hallLan.title')}
        </span>
        <span className="rst-hall-lan-banner__hint">
          {hasUrl ? t('rst.hallLan.hintWithUrl') : t('rst.hallLan.hintNoUrl')}
        </span>
      </p>
      <div className="rst-hall-lan-banner__actions">
        {hasUrl ? (
          <a
            className="rst-hall-lan-banner__btn rst-hall-lan-banner__btn--primary"
            href={primaryHref}
          >
            {t('rst.hallLan.connect')}
          </a>
        ) : null}
        {typeof onDismiss === 'function' ? (
          <button
            type="button"
            className="rst-hall-lan-banner__btn rst-hall-lan-banner__btn--ghost"
            onClick={onDismiss}
          >
            {t('rst.hallLan.dismiss')}
          </button>
        ) : null}
      </div>
      {lanHubUrls.length > 1 ? (
        <p className="rst-hall-lan-banner__urls">{lanHubUrls.join(' · ')}</p>
      ) : null}
    </div>
  );
}
