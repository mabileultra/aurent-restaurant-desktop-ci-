import { BaseCheckbox } from '../../../../../../components/ui';
import './product-import-marking-cell.css';

export default function ProductImportMarkingCell({ t, editable, isNew, marked, onChange }) {
  const on = isNew && editable ? Boolean(editable.markedProduct) : Boolean(marked);

  return (
    <div className={`product-import-marking-cell${on ? ' is-on' : ''}`}>
      {isNew && editable ? (
        <label className="product-import-marking-cell__toggle">
          <BaseCheckbox
            checked={Boolean(editable.markedProduct)}
            onChange={(e) => onChange(e.target.checked)}
            size={16}
          />
          <span className={`product-import-marking-cell__badge${on ? ' is-on' : ''}`}>
            {on ? t('products.import.markingYes') : t('products.import.markingNo')}
          </span>
        </label>
      ) : (
        <span className={`product-import-marking-cell__badge${on ? ' is-on' : ''}`}>
          {on ? t('products.import.markingYes') : t('products.import.markingNo')}
        </span>
      )}
    </div>
  );
}
