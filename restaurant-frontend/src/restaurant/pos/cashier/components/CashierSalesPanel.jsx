import { useState } from 'react';
import CounterOrdersBoard from '../../components/CounterOrdersBoard';
import '../styles/cashier-sales-panel.css';

const SALES_VIEWS = ['takeaway', 'delivery'];

/**
 * Takeaway / delivery active board (paid receipts live in header → CashierPaidPanel).
 */
export default function CashierSalesPanel({ p, setFullOrder }) {
  const [salesView, setSalesView] = useState(
    p.posMode === 'delivery' ? 'delivery' : 'takeaway',
  );

  const selectView = (view) => {
    setSalesView(view);
    if (view === 'takeaway') p.changePosMode('takeaway');
    if (view === 'delivery') p.changePosMode('delivery');
  };

  return (
    <div className="rst-cashier-panel rst-cashier-sales">
      <div className="rst-floor-section-tabs" role="tablist">
        {SALES_VIEWS.map((view) => (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={salesView === view}
            className={`rst-floor-section-tabs__btn${salesView === view ? ' is-active' : ''}`}
            onClick={() => selectView(view)}
          >
            {view === 'takeaway' && p.t('rst.pos.takeaway')}
            {view === 'delivery' && p.t('rst.pos.delivery')}
          </button>
        ))}
      </div>

      {p.isError ? <div className="rst-notice">{p.t('rst.pos.counterLoadFailed')}</div> : null}
      <CounterOrdersBoard
        channel={p.channel}
        orders={p.counterOrders}
        loading={p.counterLoading}
        onOpenNew={p.handleOpenCounter}
        onSelect={(id) => {
          p.setActiveOrderId(id);
          setFullOrder(true);
        }}
        t={p.t}
      />
    </div>
  );
}
