import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { formatMenuPortion } from '../../shared/utils/formatMenuPortion';
import {
  familyPunchScore,
  readMenuPunchMap,
  recordMenuPunch,
} from '../utils/menuPunchFrequency';
import { groupMenuFamilies } from './MenuVariantPickModal';
import '../styles/order-workspace.css';

const TAG_ORDER = ['HIT', 'SPICY', 'CHEF', 'GRILL', 'FRESH', 'TEA'];

function parseTags(raw) {
  if (!raw) return [];
  const set = new Set(
    String(raw)
      .split(/[,;|\s]+/)
      .map((part) => part.trim().toUpperCase())
      .filter(Boolean),
  );
  return TAG_ORDER.filter((code) => set.has(code)).concat(
    [...set].filter((code) => !TAG_ORDER.includes(code)),
  );
}

function familyInCheck(family, qtyByMenuId) {
  return family.variants.reduce((sum, item) => sum + (qtyByMenuId[item.id] || 0), 0);
}

function hasHitTag(item) {
  return parseTags(item?.tags).includes('HIT');
}

export default function MenuPicker({ items, onAdd, onComposeFamily, t, qtyByMenuId = {} }) {
  const workspace = useRestaurantWorkspaceStore();
  const storeId = workspace.storeId;
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [focusedId, setFocusedId] = useState(null);
  const [punchTick, setPunchTick] = useState(0);
  const searchRef = useRef(null);

  const punchMap = useMemo(
    () => readMenuPunchMap(storeId),
    [storeId, punchTick],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category && (item.category || t('rst.order.uncategorized')) !== category) return false;
      if (!q) return true;
      const hay = `${item.name || ''} ${item.sku || ''} ${item.description || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, category, query, t]);

  const families = useMemo(() => {
    const rows = groupMenuFamilies(visible);
    return rows.sort((a, b) => {
      const scoreDiff = familyPunchScore(b, punchMap) - familyPunchScore(a, punchMap);
      if (scoreDiff !== 0) return scoreDiff;
      const hitDiff = Number(hasHitTag(b.primary)) - Number(hasHitTag(a.primary));
      if (hitDiff !== 0) return hitDiff;
      return String(a.primary?.name || '').localeCompare(String(b.primary?.name || ''), undefined, {
        sensitivity: 'base',
      });
    });
  }, [visible, punchMap]);

  const categories = useMemo(() => {
    const map = new Map();
    groupMenuFamilies(items).forEach((family) => {
      const name = family.primary.category || t('rst.order.uncategorized');
      map.set(name, (map.get(name) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items, t]);

  useEffect(() => {
    const onKey = (event) => {
      const target = event.target;
      const typing = target
        && (target.tagName === 'INPUT'
          || target.tagName === 'TEXTAREA'
          || target.tagName === 'SELECT'
          || target.isContentEditable);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        setQuery('');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!items.length) {
    return <div className="rst-empty">{t('rst.order.emptyMenu')}</div>;
  }

  const search = (
      <label className="rst-menu__search">
        <span className="rst-menu__search-ico" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </span>
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('rst.order.searchMenuPh')}
        />
        <span className="rst-menu__search-hint">
          <kbd>/</kbd>
          <em>{t('rst.order.searchEsc')}</em>
        </span>
      </label>
  );
  const searchSlot = typeof document !== 'undefined'
    ? document.getElementById('rst-pos-search-slot')
    : null;

  return (
    <div className="rst-menu rst-menu--pos">
      {searchSlot ? createPortal(search, searchSlot) : search}

      <div className="rst-menu-cats">
        <button
          type="button"
          className={`rst-menu-cat${!category ? ' is-active' : ''}`}
          onClick={() => setCategory('')}
        >
          {t('rst.order.allCategories')}
          <em>{groupMenuFamilies(items).length}</em>
        </button>
        {categories.map(([name, count]) => (
          <button
            key={name}
            type="button"
            className={`rst-menu-cat${category === name ? ' is-active' : ''}`}
            onClick={() => setCategory(name)}
          >
            {name}
            <em>{count}</em>
          </button>
        ))}
      </div>

      <div className="rst-menu-grid">
        {families.map((family) => {
          const item = family.primary;
          const imageUrl = family.variants.find((variant) => variant.imageUrl)?.imageUrl || '';
          const inCheck = familyInCheck(family, qtyByMenuId);
          const focused = focusedId === family.key;
          const tags = parseTags(item.tags);
          const portion = family.multi
            ? t('rst.order.variantSizes', { count: family.variants.length })
            : formatMenuPortion(item);
          const priceLabel = family.multi && family.minPrice !== family.maxPrice
            ? t('rst.order.priceFrom', { price: fmtMoneyCompact(family.minPrice) })
            : fmtMoneyCompact(item.price);
          const className = [
            'rst-menu-card',
            inCheck > 0 ? 'is-in-check' : '',
            focused ? 'is-focus' : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              key={family.key}
              type="button"
              className={className}
              onClick={() => {
                setFocusedId(family.key);
                recordMenuPunch(storeId, family.key);
                setPunchTick((n) => n + 1);
                if (onComposeFamily) onComposeFamily(family);
                else if (family.multi) onAdd(family.variants[0]);
                else onAdd(item);
                // Brief flash, then settle on in-check — avoid sticky "burning" highlight.
                window.setTimeout(() => {
                  setFocusedId((cur) => (cur === family.key ? null : cur));
                }, 180);
              }}
            >
              <div className="rst-menu-card__media">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="rst-menu-card__img" />
                ) : (
                  <div className="rst-menu-card__media-empty">{t('rst.admin.noPhoto')}</div>
                )}
                {item.prepMinutes != null && Number(item.prepMinutes) > 0 ? (
                  <span className="rst-menu-card__prep">~{item.prepMinutes} {t('rst.order.prepMin')}</span>
                ) : null}
              </div>
              {inCheck > 0 ? (
                <span className="rst-menu-card__badge">{t('rst.order.inCheck', { count: inCheck })}</span>
              ) : null}

              {tags.length ? (
                <div className="rst-menu-card__tags">
                  {tags.map((code) => (
                    <span key={code} className={`rst-menu-tag rst-menu-tag--${code.toLowerCase()}`}>
                      {t(`rst.order.tag.${code}`, { defaultValue: code })}
                    </span>
                  ))}
                </div>
              ) : null}

              <span className="rst-menu-card__name">{item.name}</span>
              {portion ? <span className="rst-menu-card__portion">{portion}</span> : null}
              {item.description ? (
                <span className="rst-menu-card__desc">{item.description}</span>
              ) : null}
              <span className="rst-menu-card__footer">
                <span className="rst-menu-card__price">{priceLabel}</span>
                <span className="rst-menu-card__add" aria-hidden>+</span>
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
