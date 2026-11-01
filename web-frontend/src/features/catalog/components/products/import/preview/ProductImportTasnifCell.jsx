import { classifyProductImportTasnif } from '../../../../utils/classifyProductImportTasnif';
import './product-import-tasnif-cell.css';

export default function ProductImportTasnifCell({ t, row, tasnif }) {
  const tone = classifyProductImportTasnif(row, tasnif);
  const checking = tasnif?.status === 'checking';
  const ikpuCode = resolveIkpuCode(row, tasnif);

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
      {ikpuCode ? (
        <p className="product-import-tasnif-cell__ikpu" title={ikpuCode}>
          {t('products.import.colIkpu')}: {ikpuCode}
        </p>
      ) : null}
    </div>
  );
}

function resolveIkpuCode(row, tasnif) {
  const fromTasnif = String(tasnif?.ikpu || '').trim();
  if (fromTasnif) return fromTasnif;
  return String(row?.ikpu || '').trim();
}
