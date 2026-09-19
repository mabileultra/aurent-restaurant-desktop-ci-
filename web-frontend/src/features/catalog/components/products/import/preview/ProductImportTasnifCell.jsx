import { classifyProductImportTasnif } from '../../../../utils/classifyProductImportTasnif';
import './product-import-tasnif-cell.css';

export default function ProductImportTasnifCell({ t, row, tasnif }) {
  const tone = classifyProductImportTasnif(row, tasnif);
  const checking = tasnif?.status === 'checking';

  return (
    <div className="product-import-tasnif-cell">
      <span className={`product-import-tasnif-cell__badge is-${tone}`}>
        {checking
          ? t('products.import.tasnif.checkingShort')
          : t(`products.import.tasnif.${tone}`)}
      </span>
      <p className="product-import-tasnif-cell__note">
        {checking
          ? t('products.import.tasnif.checkingHint')
          : t(`products.import.tasnif.${tone}Hint`)}
      </p>
      {tasnif?.status === 'found' && tasnif.tasnifName ? (
        <p className="product-import-tasnif-cell__name" title={tasnif.tasnifName}>
          {tasnif.tasnifName}
        </p>
      ) : null}
    </div>
  );
}
