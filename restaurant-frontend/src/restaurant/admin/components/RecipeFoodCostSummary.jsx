import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { formatFoodCostPercent } from '../utils/recipeFoodCost';

export default function RecipeFoodCostSummary({ t, foodCost }) {
  if (!foodCost || foodCost.pricedLines === 0) {
    return (
      <div className="rst-tech__food-cost is-empty">
        <span>{t('rst.admin.foodCostEmpty')}</span>
      </div>
    );
  }

  return (
    <div className={`rst-tech__food-cost${foodCost.high ? ' is-high' : ''}`}>
      <div className="rst-tech__food-cost-item">
        <span>{t('rst.admin.foodCostPortion')}</span>
        <strong>{fmtMoneyCompact(foodCost.portionCost)}</strong>
      </div>
      <div className="rst-tech__food-cost-item">
        <span>{t('rst.admin.foodCostSell')}</span>
        <strong>{foodCost.sellPrice > 0 ? fmtMoneyCompact(foodCost.sellPrice) : '—'}</strong>
      </div>
      <div className="rst-tech__food-cost-item">
        <span>{t('rst.admin.foodCostPercent')}</span>
        <strong>{formatFoodCostPercent(foodCost.percent)}</strong>
      </div>
      <div className="rst-tech__food-cost-item">
        <span>{t('rst.admin.foodCostMargin')}</span>
        <strong>{foodCost.margin != null ? fmtMoneyCompact(foodCost.margin) : '—'}</strong>
      </div>
      {foodCost.missingCost ? (
        <p className="rst-tech__food-cost-hint mb-0">{t('rst.admin.foodCostMissing')}</p>
      ) : null}
      {foodCost.high ? (
        <p className="rst-tech__food-cost-hint is-warn mb-0">{t('rst.admin.foodCostHigh')}</p>
      ) : null}
    </div>
  );
}
