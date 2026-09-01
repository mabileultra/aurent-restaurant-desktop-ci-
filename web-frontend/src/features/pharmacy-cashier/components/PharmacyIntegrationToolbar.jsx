import { useState } from 'react';
import { Chrome, MoreHorizontal, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  PHARMACY_MORE_LINKS,
  PHARMACY_QUICK_LINK_IDS,
  PHARMACY_TOOLBAR_LINKS,
} from '../constants/pharmacyQuickLinks';
import { usePharmacyIntegrationToolbar } from '../hooks/usePharmacyIntegrationToolbar';
import PharmacyIntegrationMoreMenu from './PharmacyIntegrationMoreMenu';
import PharmacyMarkingModal from './PharmacyMarkingModal';
import '../styles/pharmacy-integration-toolbar.css';

function DmedMark() {
  return <span className="pharmacy-integration-toolbar__dmed-mark">DMED</span>;
}

function LinkLabel({ linkId, t }) {
  if (linkId === PHARMACY_QUICK_LINK_IDS.DMED) {
    return <DmedMark />;
  }
  if (linkId === PHARMACY_QUICK_LINK_IDS.MARKING) {
    return <QrCode size={16} strokeWidth={2} aria-hidden />;
  }
  if (linkId === PHARMACY_QUICK_LINK_IDS.IKPU) {
    return <span className="pharmacy-integration-toolbar__text-label">ИКПУ</span>;
  }
  if (linkId === PHARMACY_QUICK_LINK_IDS.ADMIN) {
    return <Chrome size={18} strokeWidth={2} aria-hidden />;
  }
  return <span className="pharmacy-integration-toolbar__text-label">{t(`pharmacyCashier.integrations.links.${linkId}`)}</span>;
}

export default function PharmacyIntegrationToolbar({
  storeId,
  capabilities,
  externalUrls,
  onFocusSearch,
}) {
  const { t } = useTranslation();
  const [markingOpen, setMarkingOpen] = useState(false);

  const toolbar = usePharmacyIntegrationToolbar({
    capabilities,
    externalUrls,
    onOpenMarking: () => setMarkingOpen(true),
    onFocusSearch,
  });

  const visibleToolbarLinks = PHARMACY_TOOLBAR_LINKS.filter(toolbar.isLinkVisible);

  return (
    <>
      <div className="pharmacy-integration-toolbar" role="toolbar" aria-label={t('pharmacyCashier.integrations.toolbar')}>
        {visibleToolbarLinks.map((link) => (
          <button
            key={link.id}
            type="button"
            className={`pharmacy-integration-toolbar__btn pharmacy-integration-toolbar__btn--${link.id}`}
            title={t(`pharmacyCashier.integrations.linkTitles.${link.id}`)}
            aria-label={t(`pharmacyCashier.integrations.linkTitles.${link.id}`)}
            onClick={() => toolbar.handleLink(link)}
          >
            <LinkLabel linkId={link.id} t={t} />
          </button>
        ))}

        <div className="pharmacy-integration-toolbar__more-wrap">
          <button
            type="button"
            className="pharmacy-integration-toolbar__btn pharmacy-integration-toolbar__btn--more"
            title={t('pharmacyCashier.integrations.moreTitle')}
            aria-label={t('pharmacyCashier.integrations.moreTitle')}
            aria-expanded={toolbar.moreOpen}
            onClick={() => toolbar.setMoreOpen((v) => !v)}
          >
            <MoreHorizontal size={16} strokeWidth={2} aria-hidden />
          </button>
          <PharmacyIntegrationMoreMenu
            open={toolbar.moreOpen}
            links={PHARMACY_MORE_LINKS}
            onSelect={toolbar.handleLink}
            onClose={() => toolbar.setMoreOpen(false)}
          />
        </div>
      </div>

      <PharmacyMarkingModal
        open={markingOpen}
        storeId={storeId}
        aslApiEnabled={capabilities.aslMarkingEnabled}
        aslPortalUrl={externalUrls.aslPortal}
        onClose={() => setMarkingOpen(false)}
      />
    </>
  );
}
