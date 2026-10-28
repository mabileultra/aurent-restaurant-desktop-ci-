import React from 'react';
import { Boxes, Receipt, Wallet } from 'lucide-react';
import { fmtDay, fmtMoney, fmtQty } from './analyticsFormat';

function SupplyCard({ icon: Icon, tone, label, value }) {
  return (
    <div className={`ta-kpi ta-kpi--${tone}`}>
      <div className="ta-kpi__top">
        <span className={`ta-kpi__icon ta-kpi__icon--${tone}`} aria-hidden>
          <Icon size={18} strokeWidth={2.2} />
        </span>
        <p className="ta-kpi__label">{label}</p>
      </div>
      <p className="ta-kpi__value">{value}</p>
    </div>
  );
}

export default function CompanySupplySection({ t, supplies, loading }) {
  const rows = supplies?.rows ?? [];
  return (
    <section className="ta-section">
      <div className="ta-section__head">
        <div>
          <h2 className="ta-section__title">{t('platform.analytics.suppliesTitle')}</h2>
          <p className="ta-section__sub">{t('platform.analytics.suppliesSubtitle')}</p>
        </div>
      </div>
      <div className="ta-kpi-grid">
        <SupplyCard
          icon={Receipt}
          tone="blue"
          label={t('platform.analytics.supplyCount')}
          value={loading ? '…' : fmtQty(supplies?.receiptCount)}
        />
        <SupplyCard
          icon={Wallet}
          tone="amber"
          label={t('platform.analytics.supplyCost')}
          value={loading ? '…' : fmtMoney(supplies?.totalCost)}
        />
        <SupplyCard
          icon={Boxes}
          tone="green"
          label={t('platform.analytics.supplyRetail')}
          value={loading ? '…' : fmtMoney(supplies?.totalRetail)}
        />
      </div>
      {loading ? <p className="ta-muted">{t('common.loading')}</p> : rows.length ? (
        <div className="ca-supplies">
          {rows.map((row) => (
            <article key={`${row.receiptNumber}-${row.documentDate}`} className="ca-supply">
              <div>
                <p className="ca-supply__title">{row.receiptNumber}</p>
                <p className="ta-muted">{row.supplierName || '—'} · {fmtDay(row.documentDate)}</p>
              </div>
              <div className="ca-supply__sums">
                <span>{fmtQty(row.totalQuantity)}</span>
                <strong>{fmtMoney(row.totalCost)}</strong>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="ta-muted">{t('platform.analytics.supplyEmpty')}</p>
      )}
    </section>
  );
}
