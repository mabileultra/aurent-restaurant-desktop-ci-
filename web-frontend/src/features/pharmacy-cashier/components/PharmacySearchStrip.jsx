import { ScanLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  PHARMACY_MORE_LINKS,
  PHARMACY_QUICK_LINK_IDS,
  PHARMACY_TOOLBAR_LINKS,
} from '../constants/pharmacyQuickLinks';
import { usePharmacyIntegrationToolbar } from '../hooks/usePharmacyIntegrationToolbar';
import PharmacyIntegrationIcon from './PharmacyIntegrationIcon';
import PharmacyIntegrationMoreMenu from './PharmacyIntegrationMoreMenu';
import PharmacyMarkingModal from './PharmacyMarkingModal';
import { useState } from 'react';
import '../styles/pharmacy-search-strip.css';

const STRIP_TOGGLES = [
  { id: PHARMACY_QUICK_LINK_IDS.DMED, labelKey: 'pharmacyCashier.searchStrip.dmed' },
  { id: PHARMACY_QUICK_LINK_IDS.ASL_PORTAL, labelKey: 'pharmacyCashier.searchStrip.asl' },
  { id: PHARMACY_QUICK_LINK_IDS.IKPU, labelKey: 'pharmacyCashier.searchStrip.ikpu' },
];

/**
 * Полоса поиска аптеки: поле + «скан» + тогглы DMED / Asl / ИКПУ.
 * Только pharmacy-cashier — retail не использует.
 */
export default function PharmacySearchStrip({
  searchInputRef,
  search,
  onSearchChange,
  onSearchEnter,
  scanDisabled,
  storeId,
  capabilities,
  externalUrls,
  onFocusSearch,
  markingModal,
  onOpenMarking,
  onCloseMarking,
  products,
  onProductFound,
}) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [activeIds, setActiveIds] = useState(() => new Set());

  const toolbar = usePharmacyIntegrationToolbar({
    capabilities,
    externalUrls,
    onOpenMarking,
    onFocusSearch,
    setMoreOpen,
  });

  const adminLink = PHARMACY_TOOLBAR_LINKS.find((l) => l.id === PHARMACY_QUICK_LINK_IDS.ADMIN);
  const markingLink = PHARMACY_TOOLBAR_LINKS.find((l) => l.id === PHARMACY_QUICK_LINK_IDS.MARKING);

  const runToggle = (linkId) => {
    const fromToolbar = PHARMACY_TOOLBAR_LINKS.find((l) => l.id === linkId);
    const fromMore = PHARMACY_MORE_LINKS.find((l) => l.id === linkId);
    const link = fromToolbar || fromMore;
    if (!link || !toolbar.isLinkVisible(link)) return;
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(linkId)) next.delete(linkId);
      else next.add(linkId);
      return next;
    });
    toolbar.handleLink(link);
  };

  return (
    <>
      <div className="pharmacy-search-strip" role="search">
        <div className="pharmacy-search-strip__scan" aria-hidden>
          <ScanLine size={16} strokeWidth={2.25} />
          <span>{t('pharmacyCashier.searchStrip.scanActive')}</span>
        </div>

        <input
          ref={searchInputRef}
          type="search"
          className="pharmacy-search-strip__field"
          value={search}
          disabled={scanDisabled}
          placeholder={t('pharmacyCashier.searchPhMarking')}
          aria-label={t('pos.searchProducts')}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSearchEnter?.();
            }
          }}
        />

        <div className="pharmacy-search-strip__toggles" role="group" aria-label={t('pharmacyCashier.integrations.toolbar')}>
          {STRIP_TOGGLES.map((item) => {
            const fromToolbar = PHARMACY_TOOLBAR_LINKS.find((l) => l.id === item.id);
            const fromMore = PHARMACY_MORE_LINKS.find((l) => l.id === item.id);
            const link = fromToolbar || fromMore;
            if (!link || !toolbar.isLinkVisible(link)) return null;
            const on = activeIds.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`pharmacy-search-strip__toggle${on ? ' is-on' : ''}`}
                aria-pressed={on}
                title={t(`pharmacyCashier.integrations.linkTitles.${item.id}`)}
                onClick={() => runToggle(item.id)}
              >
                <PharmacyIntegrationIcon linkId={item.id} />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}

          {markingLink && toolbar.isLinkVisible(markingLink) ? (
            <button
              type="button"
              className="pharmacy-search-strip__icon-btn"
              title={t('pharmacyCashier.integrations.linkTitles.marking')}
              aria-label={t('pharmacyCashier.integrations.linkTitles.marking')}
              onClick={() => toolbar.handleLink(markingLink)}
            >
              <PharmacyIntegrationIcon linkId={PHARMACY_QUICK_LINK_IDS.MARKING} />
            </button>
          ) : null}

          {adminLink && toolbar.isLinkVisible(adminLink) ? (
            <button
              type="button"
              className="pharmacy-search-strip__icon-btn"
              title={t('pharmacyCashier.integrations.linkTitles.admin')}
              aria-label={t('pharmacyCashier.integrations.linkTitles.admin')}
              onClick={() => toolbar.handleLink(adminLink)}
            >
              <PharmacyIntegrationIcon linkId={PHARMACY_QUICK_LINK_IDS.ADMIN} />
            </button>
          ) : null}

          <div className="pharmacy-search-strip__more-wrap">
            <button
              type="button"
              className={`pharmacy-search-strip__icon-btn${moreOpen ? ' is-on' : ''}`}
              title={t('pharmacyCashier.integrations.moreTitle')}
              aria-label={t('pharmacyCashier.integrations.moreTitle')}
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
            >
              ···
            </button>
            <PharmacyIntegrationMoreMenu
              open={moreOpen}
              links={PHARMACY_MORE_LINKS}
              onSelect={toolbar.handleLink}
              onClose={() => setMoreOpen(false)}
            />
          </div>
        </div>
      </div>

      <PharmacyMarkingModal
        open={Boolean(markingModal?.open)}
        storeId={storeId}
        initialCode={markingModal?.code}
        initialResult={markingModal?.result}
        aslApiEnabled={capabilities.aslMarkingEnabled}
        aslPortalUrl={externalUrls.aslPortal}
        products={products}
        onProductFound={onProductFound}
        onClose={onCloseMarking}
      />
    </>
  );
}
