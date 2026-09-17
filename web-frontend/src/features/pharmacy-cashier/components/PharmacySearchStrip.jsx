import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  PHARMACY_MORE_LINKS,
  PHARMACY_QUICK_LINK_IDS,
  PHARMACY_TOOLBAR_LINKS,
} from '../constants/pharmacyQuickLinks';
import { usePharmacyIntegrationToolbar } from '../hooks/usePharmacyIntegrationToolbar';
import { usePharmacySearchMarkAutoSubmit } from '../hooks/usePharmacySearchMarkAutoSubmit';
import { isPharmacyMarkingCode } from '../utils/pharmacyMarkingCode';
import PharmacyIntegrationIcon from './PharmacyIntegrationIcon';
import PharmacyIntegrationMoreMenu from './PharmacyIntegrationMoreMenu';
import '../styles/pharmacy-search-strip.css';

const STRIP_TOGGLES = [
  { id: PHARMACY_QUICK_LINK_IDS.DMED, labelKey: 'pharmacyCashier.searchStrip.dmed' },
  { id: PHARMACY_QUICK_LINK_IDS.ASL_PORTAL, labelKey: 'pharmacyCashier.searchStrip.asl' },
  { id: PHARMACY_QUICK_LINK_IDS.IKPU, labelKey: 'pharmacyCashier.searchStrip.ikpu' },
];

/**
 * Одно поле поиска: товар / штрихкод / DataMatrix КМ — без модалки и без кнопки КМ.
 */
export default function PharmacySearchStrip({
  searchInputRef,
  search,
  onSearchChange,
  onSearchEnter,
  onMarkingScan,
  scanDisabled,
  capabilities,
  externalUrls,
  onFocusSearch,
}) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [activeIds, setActiveIds] = useState(() => new Set());

  const toolbar = usePharmacyIntegrationToolbar({
    capabilities,
    externalUrls,
    onFocusSearch,
    setMoreOpen,
  });

  usePharmacySearchMarkAutoSubmit({
    search,
    onSearchChange,
    onMarkingScan,
    enabled: !scanDisabled,
  });

  const adminLink = PHARMACY_TOOLBAR_LINKS.find((l) => l.id === PHARMACY_QUICK_LINK_IDS.ADMIN);

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

  const handlePaste = (e) => {
    const text = e.clipboardData?.getData('text') ?? '';
    if (!isPharmacyMarkingCode(text)) return;
    e.preventDefault();
    onSearchChange?.('');
    onMarkingScan?.(text);
  };

  return (
    <div className="pharmacy-search-strip" role="search">
      <input
        ref={searchInputRef}
        type="search"
        className="pharmacy-search-strip__field pharmacy-search-strip__field--solo"
        value={search}
        disabled={scanDisabled}
        placeholder={t('pharmacyCashier.searchPhMarking')}
        aria-label={t('pos.searchProducts')}
        autoComplete="off"
        onChange={(e) => onSearchChange(e.target.value)}
        onPaste={handlePaste}
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
  );
}
