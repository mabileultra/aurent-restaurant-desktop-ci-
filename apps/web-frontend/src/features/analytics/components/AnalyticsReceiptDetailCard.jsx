import React from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import { fmtDateTimeUz, fmtMoney } from '../utils/analyticsFormat';

export default function AnalyticsReceiptDetailCard({ receipt, companyId, effectiveDay, onClose }) {
  if (!receipt) return null;

  const saleId = receipt.saleId || receipt.id;
  const isFiscal = receipt.hasQr || receipt.fiscalStatus === 'FISCAL';
  const receiptNo = receipt.receiptNumber || receipt.saleId;
  const dateStr = receipt.createdAt ? fmtDateTimeUz(receipt.createdAt) : (receipt.date || effectiveDay || '—');
  const amount = receipt.totalAmount || receipt.amount || 0;

  const detailQuery = useQuery({
    queryKey: ['analytics-receipt-detail', companyId, saleId],
    queryFn: () => analyticsApi.getCompanyReceiptDetail(companyId, saleId).then((r) => r.data),
    enabled: Boolean(companyId && saleId && !receipt.items?.length),
  });

  const fullReceipt = detailQuery.data || receipt;
  const items = fullReceipt.items || fullReceipt.products || [];

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

      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #E5E9EE', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
            <span>Tovar nomi</span>
            <span>Summa</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
            {items.map((item, idx) => {
              const qty = Number(item.quantity ?? 1);
              const unit = Number(item.unitPrice ?? item.price ?? 0);
              const line = Number(item.lineTotal ?? item.total ?? (unit * qty));
              return (
                <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', padding: '4px 0', borderBottom: '1px dashed #F1F5F9' }}>
                  <div>
                    <div style={{ fontWeight: 500, color: '#1E293B' }}>{item.productName || item.name || `Mahsulot #${idx + 1}`}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{qty} × {fmtMoney(unit, { showCurrency: false })}</div>
                  </div>
                  <div style={{ fontWeight: 600, color: '#334155' }}>
                    {fmtMoney(line)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
