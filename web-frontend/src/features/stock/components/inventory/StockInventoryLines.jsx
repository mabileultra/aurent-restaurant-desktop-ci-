import { useMemo, useState } from 'react';
import { summarizeInventory } from '../../utils/inventoryVariance';
import StockInventoryLineRow from './StockInventoryLineRow';

export default function StockInventoryLines({
  t,
  lines,
  storeId,
  updateLine,
  addLine,
  removeLine,
}) {
  const [filter, setFilter] = useState('');
  const summary = useMemo(() => summarizeInventory(lines), [lines]);
  const query = filter.trim().toLowerCase();
  const visible = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => {
      if (!query) return true;
      const hay = [line.product?.name, line.product?.sku, line.product?.barcode].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(query) || !line.productId;
    });

  return (
    <section className="stock-inv-lines">
      <div className="stock-inv-lines__head">
        <h2 className="stock-inv-lines__title">
          {t('stockReports.inventoryLines')}
          <span className="stock-inv-lines__count">{t('stockReports.inventoryPositions', { count: summary.total })}</span>
        </h2>
        <div className="stock-inv-lines__tools">
          <input
            className="stock-inv-lines__filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('stockReports.inventoryFilter')}
          />
          <button type="button" className="stock-inv-lines__add" onClick={addLine}>
            + {t('stockReports.addLine')}
          </button>
        </div>
      </div>
      <div className="stock-inv-lines__scroll">
        <table className="stock-inv-lines__table">
          <colgroup>
            <col style={{ width: 48 }} />
            <col />
            <col style={{ width: 168 }} />
            <col style={{ width: 128 }} />
            <col style={{ width: 156 }} />
            <col style={{ width: 168 }} />
            <col style={{ width: 40 }} />
          </colgroup>
          <thead>
            <tr>
              <th>№</th>
              <th>{t('stockReports.inventoryColProduct')}</th>
              <th>{t('stockReports.inventoryColSku')}</th>
              <th>{t('stockReports.inventoryColBook')}</th>
              <th>{t('stockReports.countedQty')}</th>
              <th>{t('stockReports.inventoryColVariance')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map(({ line, index }) => (
              <StockInventoryLineRow
                key={line.key ?? index}
                t={t}
                index={index}
                line={line}
                storeId={storeId}
                canRemove={lines.length > 1}
                onProduct={(productId, product) => updateLine(index, { productId, product })}
                onFact={(countedQuantity) => updateLine(index, { countedQuantity })}
                onClearProduct={() => updateLine(index, { productId: '', product: null, countedQuantity: '' })}
                onRemove={() => removeLine(index)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="stock-inv-legend">
        <span><i className="stock-inv-legend__dot stock-inv-legend__dot--match" />{t('stockReports.inventoryLegendMatch', { count: summary.match })}</span>
        <span><i className="stock-inv-legend__dot stock-inv-legend__dot--shortage" />{t('stockReports.inventoryLegendShortage', { count: summary.shortage })}</span>
        <span><i className="stock-inv-legend__dot stock-inv-legend__dot--surplus" />{t('stockReports.inventoryLegendSurplus', { count: summary.surplus })}</span>
      </div>
    </section>
  );
}
