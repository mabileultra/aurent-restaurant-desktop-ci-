import '../../../styles/billing.css';
import { PageLayout } from '../../../components/ui';
import { useTenantBillingPage } from '../hooks/useTenantBillingPage';

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU');
}

export default function TenantBillingPage() {
  const p = useTenantBillingPage();
  const me = p.me;

  return (
    <PageLayout
      spacing="space-y-4"
      title={p.t('billing.title')}
      subtitle={p.t('billing.subtitle')}
    >
      <div className="billing-page space-y-4">
        {me?.status === 'BLOCKED' ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {p.t('billing.blockedBanner')}
          </div>
        ) : null}

        <section className="billing-hero">
          <div>
            <div className="billing-hero__meta">
              <span className={`billing-chip ${me?.status === 'ACTIVE' || me?.status === 'TRIAL' ? 'billing-chip--ok' : ''}`}>
                {p.statusLabel}
              </span>
              <span className="billing-chip">{me?.planName || p.t('billing.noPlan')}</span>
            </div>
            <p className="text-sm text-white/80 mb-1">{p.t('billing.availableBalance')}</p>
            <div className="billing-hero__balance">{p.money(me?.balance)} сум</div>
            <p className="billing-hero__hint">
              {p.t('billing.nextChargeHint', {
                date: me?.nextChargeAt ? new Date(me.nextChargeAt).toLocaleDateString('ru-RU') : '—',
                amount: p.money(me?.monthlyTotal),
              })}
            </p>
          </div>
          <div className="billing-hero__side">
            <div>
              <p className="text-sm text-white/80">{p.t('billing.periodLeft')}</p>
              <p className="text-2xl font-bold mt-1">
                {p.remaining == null ? '—' : p.t('billing.daysLeft', { count: p.remaining })}
              </p>
              <div className="billing-progress mt-3">
                <span style={{ width: `${p.progress}%` }} />
              </div>
            </div>
            <div className="billing-hero__actions">
              <a href="#billing-topup" className="billing-btn billing-btn--primary">+ {p.t('billing.topUp')}</a>
            </div>
          </div>
        </section>

        <section className="billing-metrics">
          <div className="billing-metric">
            <div className="billing-metric__label">{p.t('billing.metricPlan')}</div>
            <div className="billing-metric__value">{me?.planName || '—'}</div>
            <div className="billing-metric__sub">
              {me?.maxRegisters ? `${me.maxRegisters} касс` : '—'} · {me?.maxStores ? `${me.maxStores} филиала` : '—'}
            </div>
          </div>
          <div className="billing-metric">
            <div className="billing-metric__label">{p.t('billing.metricNext')}</div>
            <div className="billing-metric__value">
              {me?.nextChargeAt ? new Date(me.nextChargeAt).toLocaleDateString('ru-RU') : '—'}
            </div>
            <div className="billing-metric__sub">
              {me?.autoChargeEnabled ? p.t('billing.autoOn') : p.t('billing.autoOff')}
            </div>
          </div>
          <div className="billing-metric">
            <div className="billing-metric__label">{p.t('billing.metricMonthly')}</div>
            <div className="billing-metric__value">{p.money(me?.monthlyTotal)} сум</div>
            <div className="billing-metric__sub">
              {p.t('billing.monthlyBreakdown', {
                plan: p.money(me?.planMonthlyPrice),
                addon: p.money(me?.addonMonthlyAmount),
              })}
            </div>
          </div>
          <div className="billing-metric">
            <div className="billing-metric__label">{p.t('billing.metricStatus')}</div>
            <div className="billing-metric__value">
              <span className={`billing-badge billing-badge--${me?.status || 'ACTIVE'}`}>{me?.status || 'ACTIVE'}</span>
            </div>
            <div className="billing-metric__sub">{p.t('billing.graceHint')}</div>
          </div>
        </section>

        <section className="billing-grid">
          <div className="billing-panel">
            <h3 className="billing-panel__title">{p.t('billing.ledgerTitle')}</h3>
            <div className="billing-tabs">
              {p.ledgerTabs.map((tab) => (
                <button
                  key={tab || 'all'}
                  type="button"
                  className={`billing-tab ${p.ledgerType === tab ? 'billing-tab--active' : ''}`}
                  onClick={() => p.setLedgerType(tab)}
                >
                  {tab ? p.t(`billing.ledgerTypes.${tab}`) : p.t('billing.ledgerAll')}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="billing-table">
                <thead>
                  <tr>
                    <th>{p.t('billing.colDate')}</th>
                    <th>{p.t('billing.colType')}</th>
                    <th>{p.t('billing.colDesc')}</th>
                    <th>{p.t('billing.colAmount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {p.loading ? (
                    <tr><td colSpan={4}>{p.t('common.loading')}</td></tr>
                  ) : p.ledger.length === 0 ? (
                    <tr><td colSpan={4}>{p.t('billing.ledgerEmpty')}</td></tr>
                  ) : (
                    p.ledger.map((row) => {
                      const plus = Number(row.amount) >= 0;
                      return (
                        <tr key={row.id}>
                          <td>{formatDateTime(row.createdAt)}</td>
                          <td><span className={`billing-badge billing-badge--${row.entryType}`}>{row.entryType}</span></td>
                          <td>{row.description || '—'}</td>
                          <td className={plus ? 'billing-amount--plus' : 'billing-amount--minus'}>
                            {plus ? '+' : ''}{p.money(row.amount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div id="billing-topup" className="billing-topup">
            <h3 className="billing-topup__title">{p.t('billing.quickTopUp')}</h3>
            <div className="billing-presets">
              {p.presets.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`billing-preset ${String(p.amount) === String(value) ? 'billing-preset--active' : ''}`}
                  onClick={() => p.setAmount(String(value))}
                >
                  {p.money(value)}
                </button>
              ))}
            </div>
            <input
              className="billing-input"
              type="number"
              min="1"
              value={p.amount}
              onChange={(e) => p.setAmount(e.target.value)}
              placeholder={p.t('billing.customAmount')}
            />
            <textarea
              className="billing-textarea"
              rows={2}
              value={p.comment}
              onChange={(e) => p.setComment(e.target.value)}
              placeholder={p.t('billing.comment')}
            />
            <label className="billing-drop">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => p.setFile(e.target.files?.[0] || null)}
              />
              {p.file ? p.file.name : p.t('billing.attachFile')}
            </label>
            <button
              type="button"
              className="billing-btn billing-btn--accent"
              disabled={p.submitting || !p.amount}
              onClick={p.submit}
            >
              {p.submitting ? p.t('common.saving') : p.t('billing.sendToSuperAdmin')}
            </button>
            <p className="mt-2 text-xs text-slate-500">{p.t('billing.topUpHint')}</p>
            {p.pendingTopUps.length > 0 ? (
              <p className="mt-3 text-sm text-amber-700">
                {p.t('billing.pendingCount', { count: p.pendingTopUps.length })}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
