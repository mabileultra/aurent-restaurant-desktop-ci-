import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  PHARMACY_MORE_LINKS,
  PHARMACY_TOOLBAR_LINKS,
} from '../constants/pharmacyQuickLinks';
import { usePharmacyIntegrationToolbar } from '../hooks/usePharmacyIntegrationToolbar';
import PharmacyIntegrationIcon from './PharmacyIntegrationIcon';
import PharmacyIntegrationMoreMenu from './PharmacyIntegrationMoreMenu';
import PharmacyMarkingModal from './PharmacyMarkingModal';
import '../styles/pharmacy-integration-toolbar.css';

export default function PharmacyIntegrationToolbar({
  storeId,
  capabilities,
  externalUrls,
  onFocusSearch,
  markingModal,
  onOpenMarking,
  onCloseMarking,
}) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);

  const toolbar = usePharmacyIntegrationToolbar({
    capabilities,
    externalUrls,
    onOpenMarking,
    onFocusSearch,
    setMoreOpen,
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
            <PharmacyIntegrationIcon linkId={link.id} />
          </button>
        ))}

        <div className="pharmacy-integration-toolbar__more-wrap">
          <button
            type="button"
            className={`pharmacy-integration-toolbar__btn pharmacy-integration-toolbar__btn--more${moreOpen ? ' pharmacy-integration-toolbar__btn--active' : ''}`}
            title={t('pharmacyCashier.integrations.moreTitle')}
            aria-label={t('pharmacyCashier.integrations.moreTitle')}
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          >
            <MoreHorizontal size={16} strokeWidth={2} aria-hidden />
          </button>
          <PharmacyIntegrationMoreMenu
            open={moreOpen}
            links={PHARMACY_MORE_LINKS}
            onSelect={toolbar.handleLink}
            onClose={() => setMoreOpen(false)}
          />
        </div>
      </div>

      <PharmacyMarkingModal
        open={Boolean(markingModal?.open)}
        storeId={storeId}
        initialCode={markingModal?.code}
        initialResult={markingModal?.result}
        aslApiEnabled={capabilities.aslMarkingEnabled}
        aslPortalUrl={externalUrls.aslPortal}
        onClose={onCloseMarking}
      />
    </>
  );
}
