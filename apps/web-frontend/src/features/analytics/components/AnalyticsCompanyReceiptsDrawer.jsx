import React, { useMemo, useState } from 'react';
import { ArrowRight, QrCode, X } from 'lucide-react';
import { fmtDayFull, fmtMoney } from '../utils/analyticsFormat';

export default function AnalyticsCompanyReceiptsDrawer({
  date = '',
  storeName = 'Do‘kon',
  receipts = [],
  total = 0,
  totalAmount,
  onClose,
  onSelectReceipt,
}) {
  const [filterKind, setFilterKind] = useState('ALL'); // 'ALL' | 'QR' | 'NO_QR'

  const computedTotalAmount = useMemo(() => {
    if (totalAmount != null) return totalAmount;
    return receipts.reduce((sum, r) => sum + Number(r.totalAmount || r.amount || 0), 0);
  }, [totalAmount, receipts]);

  const filtered = receipts.filter((r) => {
    const hasQr = r.hasQr || r.fiscalStatus === 'FISCAL' || r.fiscalStatus === 'CONFIRMED';
    if (filterKind === 'QR') return hasQr;
    if (filterKind === 'NO_QR') return !hasQr;
    return true;
  });

  const dateTitle = date ? `${fmtDayFull(date)} — cheklar` : 'Cheklar ro‘yxati';

  return (
    <div className="an-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }} aria-label="Kungi cheklar paneli">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
        <div>
          <h3 className="an-card-title">{dateTitle}</h3>
          <p className="an-card-sub">
            {total || receipts.length} ta chek · {fmtMoney(computedTotalAmount)} · {storeName}
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

      <div className="an-table-wrap" style={{ flex: 1, minHeight: 220, maxHeight: 480, overflowY: 'auto' }}>
        <table className="an-table">
          <thead>
            <tr>
              <th>Chek</th>
              <th>Vaqt</th>
              <th>Summa</th>
              <th style={{ minWidth: 95 }}>QR</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  Cheklar topilmadi
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const receiptNo = r.receiptNumber || r.receiptNo || (r.saleId ? String(r.saleId).slice(0, 8) : 'Chek');
                const time = r.createdAt ? r.createdAt.substring(11, 16) : (r.time || '—');
                const amount = Number(r.totalAmount || r.amount || 0);
                const hasQr = r.hasQr || r.fiscalStatus === 'FISCAL';

                return (
                  <tr
                    key={r.saleId || r.receiptNumber || receiptNo}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectReceipt && onSelectReceipt(r)}
                  >
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{receiptNo}</td>
                    <td style={{ color: '#64748b' }}>{time}</td>
                    <td><strong>{fmtMoney(amount)}</strong></td>
                    <td style={{ minWidth: 95, whiteSpace: 'nowrap' }}>
                      {hasQr ? (
                        <span className="an-badge an-badge--blue">
                          <QrCode size={11} aria-hidden /> QR bilan
                        </span>
                      ) : (
                        <span className="an-badge an-badge--amber">QR’siz</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
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
        <span style={{ color: '#64748b' }}>1–{filtered.length} / {total || receipts.length}</span>
        <button
          type="button"
          style={{
            border: 'none',
            background: 'none',
            color: '#2563EB',
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
