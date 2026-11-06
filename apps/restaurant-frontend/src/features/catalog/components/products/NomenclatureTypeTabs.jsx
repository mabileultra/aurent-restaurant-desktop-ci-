import { NOMENCLATURE_TYPE_TABS } from '../../utils/nomenclatureTypes';
import '../../styles/nomenclature-type-tabs.css';

const TAB_LABEL_KEYS = {
  ALL: 'rst.nomenclature.tabAll',
  PRODUCT: 'rst.nomenclature.tabProduct',
  INGREDIENT: 'rst.nomenclature.tabIngredient',
};

export default function NomenclatureTypeTabs({ value, onChange, t }) {
  return (
    <div className="rst-nomenclature-tabs" role="tablist" aria-label={t('rst.nomenclature.tabsLabel')}>
      {NOMENCLATURE_TYPE_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={value === tab.key}
          className={`rst-nomenclature-tabs__btn${value === tab.key ? ' is-active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {t(TAB_LABEL_KEYS[tab.key] ?? tab.key)}
        </button>
      ))}
    </div>
  );
}
