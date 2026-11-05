import React from 'react';
import { X } from 'lucide-react';
import { fmtMoney } from '../utils/analyticsFormat';

export default function AnalyticsReceiptDetailCard({ receipt, effectiveDay, onClose }) {
  if (!receipt) return null;

  const isFiscal = receipt.hasQr || receipt.fiscalStatus === 'FISCAL';
  const receiptNo = receipt.receiptNumber || receipt.saleId;
  const dateStr = receipt.createdAt || receipt.date || effectiveDay || '—';
  const amount = receipt.totalAmount || receipt.amount || 0;

  return (
    <div className="card" style={{ flex: '1 1 320px', minWidth: '300px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="t" style={{ fontSize: '15px' }}>Chek tafsilotlari</h3>
        <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8' }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6B7280' }}>Raqam:</span>
          <strong>{receiptNo}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6B7280' }}>Sana:</span>
          <span>{dateStr}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6B7280' }}>Summa:</span>
          <strong style={{ color: '#2563EB' }}>{fmtMoney(amount)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6B7280' }}>Holat:</span>
          <span>{isFiscal ? 'Fiskallashtirilgan' : 'Nofiskal'}</span>
        </div>
      </div>
    </div>
  );
}
