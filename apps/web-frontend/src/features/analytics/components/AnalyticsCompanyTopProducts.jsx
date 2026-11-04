import React from 'react';
import { fmtMoney, fmtQty } from '../utils/analyticsFormat';

const DEFAULT_PRODUCTS = [
  { rank: 1, name: 'Пахта ёғи (тозаланган ёки тозаланмаган): Хлопковое, ПЭТ бутилка 5.0 л.', amount: 2000000000, quantity: 21994 },
  { rank: 2, name: 'Биринчи навли буғдой уни', amount: 25000, quantity: 5 },
  { rank: 3, name: 'Қамиш шакар', amount: 10000, quantity: 1 },
];

export default function AnalyticsCompanyTopProducts({ products = [] }) {
  const list = products.length > 0 ? products : DEFAULT_PRODUCTS;

  return (
    <div className="an-card" aria-label="Eng ko‘p sotilgan tovarlar">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Eng ko‘p sotilgan tovarlar</h3>
          <p className="an-card-sub">Tanlangan davrda, summa bo‘yicha</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {list.map((item, idx) => {
          const rank = item.rank || idx + 1;
          return (
            <div
              key={item.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.85rem',
                border: '1px solid #f1f5f9',
                borderRadius: '0.65rem',
                background: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '0.35rem',
                    background: '#e2e8f0',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {rank}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Miqdor: {fmtQty(item.quantity)}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                {fmtMoney(item.amount)}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: '0.73rem', color: '#64748b', margin: '0.75rem 0 0', fontStyle: 'italic' }}>
        ⓘ Aylanmaning deyarli hammasi bitta tovarga to‘g‘ri keladi
      </p>
    </div>
  );
}
