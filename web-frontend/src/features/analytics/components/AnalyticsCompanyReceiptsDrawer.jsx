import React, { useState } from 'react';
import { ArrowRight, QrCode, X } from 'lucide-react';
import { fmtMoney } from '../utils/analyticsFormat';

const DEFAULT_RECEIPTS = [
  { saleId: 1, receiptNo: 'RCP-20261024-0201', time: '15:27', amount: 2400000, hasQr: true },
  { saleId: 2, receiptNo: 'RCP-20261024-0200', time: '15:26', amount: 24700000, hasQr: true },
  { saleId: 3, receiptNo: 'RCP-20261024-0199', time: '15:26', amount: 24700000, hasQr: true },
  { saleId: 4, receiptNo: 'RCP-20261024-0198', time: '15:25', amount: 24700000, hasQr: true },
  { saleId: 5, receiptNo: 'RCP-20261024-0197', time: '15:25', amount: 24700000, hasQr: true },
  { saleId: 6, receiptNo: 'RCP-20261024-0196', time: '15:25', amount: 24700000, hasQr: true },
  { saleId: 7, receiptNo: 'RCP-20261024-0195', time: '15:24', amount: 24700000, hasQr: true },
  { saleId: 8, receiptNo: 'RCP-20261024-0194', time: '15:24', amount: 24700000, hasQr: true },
];

export default function AnalyticsCompanyReceiptsDrawer({
  date = '2026-10-24',
  dateTitle = '24-oktabr, shanba — cheklar',
  storeName = 'Farina Invest do‘koni',
  receipts = DEFAULT_RECEIPTS,
  total = 51,
  totalAmount = 1190000000,
  onClose,
  onSelectReceipt,
}) {
  const [filterKind, setFilterKind] = useState('ALL'); // 'ALL' | 'QR' | 'NO_QR'

  const filtered = receipts.filter((r) => {
    if (filterKind === 'QR') return r.hasQr;
    if (filterKind === 'NO_QR') return !r.hasQr;
    return true;
  });

  return (
    <div className="an-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }} aria-label="Kungi cheklar paneli">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
        <div>
          <h3 className="an-card-title">{dateTitle}</h3>
          <p className="an-card-sub">
            {total} ta chek · {fmtMoney(totalAmount)} · {storeName}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="an-period-group" style={{ marginBottom: '0.75rem' }}>
        <button
          type="button"
          className={`an-period-btn${filterKind === 'ALL' ? ' is-active' : ''}`}
          onClick={() => setFilterKind('ALL')}
        >
          Barchasi
        </button>
        <button
          type="button"
          className={`an-period-btn${filterKind === 'QR' ? ' is-active' : ''}`}
          onClick={() => setFilterKind('QR')}
        >
          QR bilan
        </button>
        <button
          type="button"
          className={`an-period-btn${filterKind === 'NO_QR' ? ' is-active' : ''}`}
          onClick={() => setFilterKind('NO_QR')}
        >
          QR’siz
        </button>
      </div>

      <div className="an-table-wrap" style={{ flex: 1, minHeight: 220 }}>
        <table className="an-table">
          <thead>
            <tr>
              <th>Chek</th>
              <th>Vaqt</th>
              <th>Summa</th>
              <th>QR</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.receiptNo || r.saleId}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectReceipt && onSelectReceipt(r)}
              >
                <td style={{ fontWeight: 600, color: '#0f172a' }}>{r.receiptNo}</td>
                <td style={{ color: '#64748b' }}>{r.time || '15:26'}</td>
                <td><strong>{fmtMoney(r.amount)}</strong></td>
                <td>
                  {r.hasQr ? (
                    <span className="an-badge an-badge--green">
                      <QrCode size={11} aria-hidden /> QR bilan
                    </span>
                  ) : (
                    <span className="an-badge an-badge--amber">QR’siz</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '0.75rem',
        marginTop: '0.5rem',
        borderTop: '1px solid #f1f5f9',
        fontSize: '0.75rem',
      }}>
        <span style={{ color: '#64748b' }}>1–{filtered.length} / {total}</span>
        <button
          type="button"
          style={{
            border: 'none',
            background: 'none',
            color: '#047857',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <span>Barcha cheklar</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
