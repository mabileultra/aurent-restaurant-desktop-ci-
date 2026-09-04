import {
  Droplets,
  Filter,
  FlaskConical,
  FolderOpen,
  LayoutGrid,
  Leaf,
  Package,
  Shield,
  Sprout,
  Tag,
  Wrench,
} from 'lucide-react';
import { ALL_CATEGORY_ID } from '../../hooks/usePosCatalogPanel';

const CHIP_ICONS = [Sprout, Leaf, Droplets, Shield, Wrench, Package, FlaskConical, Tag, FolderOpen];

export default function PosCatalogQuickFilters({
  t,
  categories,
  categoriesLoading,
  selectedCategoryId,
  searchActive,
  onSelect,
}) {
  if (categoriesLoading || !categories?.length) return null;

  const activeId = searchActive ? null : selectedCategoryId;

  return (
    <div className="pos-quick-filters" role="toolbar" aria-label={t('pos.quickFilter')}>
      <span className="pos-quick-filters__label">
        <Filter size={14} strokeWidth={2.25} aria-hidden />
        {t('pos.quickFilter')}:
      </span>
      <div className="pos-quick-filters__scroller">
        <button
          type="button"
          className={`pos-quick-filters__chip${activeId === ALL_CATEGORY_ID ? ' is-active' : ''}`}
          onClick={() => onSelect(ALL_CATEGORY_ID)}
        >
          <span className="pos-quick-filters__chip-icon" data-tone="0" aria-hidden>
            <LayoutGrid size={14} strokeWidth={2.25} />
          </span>
          <span className="pos-quick-filters__chip-name">{t('pos.allProducts')}</span>
        </button>
        {categories.map((cat, index) => {
          const Icon = CHIP_ICONS[index % CHIP_ICONS.length];
          const tone = String((index % 5) + 1);
          return (
            <button
              key={cat.id}
              type="button"
              className={`pos-quick-filters__chip${activeId === cat.id ? ' is-active' : ''}`}
              onClick={() => onSelect(cat.id)}
              title={cat.name}
            >
              <span className="pos-quick-filters__chip-icon" data-tone={tone} aria-hidden>
                <Icon size={14} strokeWidth={2.25} />
              </span>
              <span className="pos-quick-filters__chip-name">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
