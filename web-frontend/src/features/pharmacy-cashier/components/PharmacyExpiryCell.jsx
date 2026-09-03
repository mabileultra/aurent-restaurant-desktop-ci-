import { formatExpiryRemaining, formatExpiryRemainingParts } from '../utils/pharmacyProductMeta';
import { pharmacyCellToneClass, pharmacyExpiryTone } from '../utils/pharmacyCellTone';

export default function PharmacyExpiryCell({ product, daysLabel, classPrefix, muteTone = false }) {
  const { date, days } = formatExpiryRemainingParts(product, daysLabel);
  const title = formatExpiryRemaining(product, daysLabel) || undefined;
  const tone = muteTone ? null : pharmacyExpiryTone(product);
  const className = [
    `${classPrefix}__mono`,
    `${classPrefix}__expiry`,
    pharmacyCellToneClass(tone, `${classPrefix}__cell`),
  ]
    .filter(Boolean)
    .join(' ');

  if (!date && !days) {
    return <td className={className}>—</td>;
  }

  return (
    <td className={className} title={title}>
      <span className="pharmacy-expiry-cell">
        {date ? <span className="pharmacy-expiry-cell__date">{date}</span> : null}
        {days ? (
          <span className="pharmacy-expiry-cell__days" aria-label={title}>
            {days}
          </span>
        ) : null}
      </span>
    </td>
  );
}
