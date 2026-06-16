import { LayoutGrid, List } from 'lucide-react';

export default function PosCatalogViewToggle({ viewMode, onChange, t }) {
  return (
    <div className="pos-catalog-toolbar__views" role="group" aria-label={t('pos.viewModeLabel')}>
      <button
        type="button"
        className={`pos-catalog-toolbar__view-btn${viewMode === 'grid' ? ' is-active' : ''}`}
        onClick={() => onChange('grid')}
        title={t('pos.viewAsCards')}
      >
        <LayoutGrid size={18} aria-hidden />
      </button>
      <button
        type="button"
        className={`pos-catalog-toolbar__view-btn${viewMode === 'list' ? ' is-active' : ''}`}
        onClick={() => onChange('list')}
        title={t('pos.viewAsList')}
      >
        <List size={18} aria-hidden />
      </button>
    </div>
  );
}
