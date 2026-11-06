import React from 'react';
import { QrCode } from 'lucide-react';
import { fmtDateTimeUz, fmtMoney } from '../utils/analyticsFormat';

export default function AnalyticsReceiptsTable({
  receipts = [],
  loading = false,
  selectedReceipt,
  onSelectReceipt,
  effectiveDay = '',
}) {
  return (
    <div className="an-table-wrap" style={{ maxHeight: '520px', overflowY: 'auto' }}>
      <table className="an-table">
        <thead>
          <tr>
            <th>Chek raqami</th>
            <th>Sana / Vaqt</th>
            <th>Do‘kon</th>
            <th>Summa</th>
            <th>Holati</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>Yuklanmoqda...</td></tr>
          ) : receipts.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>Cheklar topilmadi</td></tr>
          ) : (
            receipts.map((r) => {
              const id = r.receiptNumber || r.saleId;
              const hasQr = r.hasQr || r.fiscalStatus === 'FISCAL';
              const isSelected = selectedReceipt && (selectedReceipt.receiptNumber || selectedReceipt.saleId) === id;
              return (
                <tr
                  key={id}
                  onClick={() => onSelectReceipt && onSelectReceipt(r)}
                  style={{ cursor: 'pointer', background: isSelected ? '#F5F8FF' : undefined }}
                >
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{id}</td>
                  <td style={{ color: '#6B7280' }}>
                    {r.createdAt ? fmtDateTimeUz(r.createdAt) : (r.date || effectiveDay || '—')}
                  </td>
                  <td>{r.storeName || 'Asosiy do‘kon'}</td>
                  <td><strong>{fmtMoney(r.totalAmount || r.amount || 0)}</strong></td>
                  <td>
                    <span className={`badge ${hasQr ? 'ok' : 'no'}`}>
                      {hasQr && <QrCode size={11} />}
                      {hasQr ? 'QR bilan' : 'QR’siz'}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
