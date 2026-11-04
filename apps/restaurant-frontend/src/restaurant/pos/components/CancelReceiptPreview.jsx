import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../styles/cancel-receipt-preview.css';

/** Mini check for cancel / kitchen-refuse confirm dialogs. */
export default function CancelReceiptPreview({
  lines = [],
  total = null,
  hint = null,
  t,
}) {
  const rows = (lines ?? []).filter((line) => line && (Number(line.quantity) || 0) > 0);
  if (!rows.length) return null;

  return (
    <div className="rst-cancel-receipt">
      {hint ? <p className="rst-cancel-receipt__hint">{hint}</p> : null}
      <ul className="rst-cancel-receipt__lines">
        {rows.map((line) => {
          const mods = line.modifiers ?? [];
          return (
            <li key={line.id || `${line.name}-${line.quantity}`} className="rst-cancel-receipt__line">
              <div className="rst-cancel-receipt__row">
                <strong className="rst-cancel-receipt__name">{line.name}</strong>
                <span className="rst-cancel-receipt__qty">× {Number(line.quantity) || 0}</span>
                <span className="rst-cancel-receipt__sum">
                  {fmtMoneyCompact(line.lineTotal ?? ((Number(line.unitPrice) || 0) * (Number(line.quantity) || 0)))}
                </span>
              </div>
              <div className="rst-cancel-receipt__meta">
                {fmtMoneyCompact(line.unitPrice)}
                {' · '}
                {line.itemStatus && line.itemStatus !== 'NEW' && line.itemStatus !== 'CANCELLED'
                  ? t('rst.order.onKitchen')
                  : t('rst.order.badgeNew')}
              </div>
              {mods.length ? (
                <div className="rst-cancel-receipt__mods">
                  {mods.map((mod) => (
                    <span key={mod.id || mod.name}>+ {mod.name}</span>
                  ))}
                </div>
              ) : null}
              {line.note ? (
                <div className="rst-cancel-receipt__note">«{line.note}»</div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {total != null ? (
        <div className="rst-cancel-receipt__total">
          <span>{t('rst.floor.amount')}</span>
          <strong>{fmtMoneyCompact(total)}</strong>
        </div>
      ) : null}
    </div>
  );
}
