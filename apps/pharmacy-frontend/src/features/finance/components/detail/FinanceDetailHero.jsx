import { Calendar } from 'lucide-react';

export default function FinanceDetailHero({ amountLabel, amount, amountTone = 'neutral', date }) {
  return (
    <div className="finance-detail-modal__hero">
      <p className="finance-detail-modal__hero-label">{amountLabel}</p>
      <p className={`finance-detail-modal__hero-amount finance-detail-modal__hero-amount--${amountTone}`}>
        {amount}
      </p>
      {date ? (
        <span className="finance-detail-modal__date-badge">
          <Calendar size={14} />
          {date}
        </span>
      ) : null}
    </div>
  );
}
