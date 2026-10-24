import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  PHARMACY_MORE_LINKS,
  PHARMACY_QUICK_LINK_IDS,
  PHARMACY_TOOLBAR_LINKS,
} from '../constants/pharmacyQuickLinks';
import { usePharmacyIntegrationToolbar } from '../hooks/usePharmacyIntegrationToolbar';
import { usePharmacySearchMarkAutoSubmit } from '../hooks/usePharmacySearchMarkAutoSubmit';
import { isMarkingCode } from '../../marking';
import PharmacyIntegrationIcon from './PharmacyIntegrationIcon';
import PharmacyIntegrationMoreMenu from './PharmacyIntegrationMoreMenu';
import '../styles/pharmacy-search-strip.css';

const STRIP_TOGGLES = [
  { id: PHARMACY_QUICK_LINK_IDS.DMED, labelKey: 'pharmacyCashier.searchStrip.dmed' },
  { id: PHARMACY_QUICK_LINK_IDS.ASL_PORTAL, labelKey: 'pharmacyCashier.searchStrip.asl' },
  { id: PHARMACY_QUICK_LINK_IDS.IKPU, labelKey: 'pharmacyCashier.searchStrip.ikpu' },
];

/**
 * Два поля рядом: товар/штрихкод + КМ DataMatrix. Скан сам выбирает нужный путь.
 */
export default function PharmacySearchStrip({
  searchInputRef,
  kmInputRef,
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
  const [kmCode, setKmCode] = useState('');

  const toolbar = usePharmacyIntegrationToolbar({
    capabilities,
    externalUrls,
    onFocusSearch,
    setMoreOpen,
  });

  // После добавления по КМ — остаёмся в поле КМ для следующего скана
  usePharmacySearchMarkAutoSubmit({
    search: kmCode,
    onSearchChange: setKmCode,
    onMarkingScan: (code) => {
      onMarkingScan?.(code);
      requestAnimationFrame(() => kmInputRef?.current?.focus());
    },
    enabled: !scanDisabled,
  });

  // Если DataMatrix попал в товарный поиск — тоже автоматом в чек
  usePharmacySearchMarkAutoSubmit({
    search,
    onSearchChange,
    onMarkingScan,
    enabled: !scanDisabled,
  });

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

  const submitKm = (raw) => {
    const value = String(raw || '').trim();
    if (!value) return;
    setKmCode('');
    onMarkingScan?.(value);
    requestAnimationFrame(() => kmInputRef?.current?.focus());
  };

  const handleProductPaste = (e) => {
    const text = e.clipboardData?.getData('text') ?? '';
    if (!isMarkingCode(text)) return;
    e.preventDefault();
    onSearchChange?.('');
    onMarkingScan?.(text);
  };

  const handleKmPaste = (e) => {
    const text = e.clipboardData?.getData('text') ?? '';
    if (!text.trim()) return;
    e.preventDefault();
    submitKm(text);
  };

  return (
    <div className="pharmacy-search-strip" role="search">
      <div className="pharmacy-search-strip__fields">
        <input
          ref={searchInputRef}
          type="search"
          className="pharmacy-search-strip__field pharmacy-search-strip__field--product"
          value={search}
          disabled={scanDisabled}
          placeholder={t('pharmacyCashier.searchPh')}
          aria-label={t('pos.searchProducts')}
          autoComplete="off"
          onChange={(e) => onSearchChange(e.target.value)}
          onPaste={handleProductPaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSearchEnter?.();
            }
          }}
        />

        <label className="pharmacy-search-strip__km-wrap">
          <span className="pharmacy-search-strip__km-badge" aria-hidden>
            {t('pharmacyCashier.searchStrip.km')}
          </span>
          <input
            ref={kmInputRef}
            type="search"
            className="pharmacy-search-strip__field pharmacy-search-strip__field--km"
            value={kmCode}
            disabled={scanDisabled}
            placeholder={t('pharmacyCashier.searchStrip.kmPh')}
            aria-label={t('pharmacyCashier.searchStrip.kmTitle')}
            title={t('pharmacyCashier.searchStrip.kmTitle')}
            autoComplete="off"
            onChange={(e) => setKmCode(e.target.value)}
            onPaste={handleKmPaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitKm(kmCode);
              }
            }}
          />
        </label>
      </div>

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
