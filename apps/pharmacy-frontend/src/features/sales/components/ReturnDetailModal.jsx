import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { returnApi, pharmacySalesApi } from '../../../api';

import { fmtMoney } from '../../../utils/formatMoney';

function fmtAt(iso) {
  try {
    return format(typeof iso === 'string' ? parseISO(iso) : new Date(iso), 'dd.MM.yyyy HH:mm');
  } catch {
    return '—';
  }
}

function InfoRow({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}

export default function ReturnDetailModal({
  open,
  returnId,
  reasonPreview,
  onClose,
  catalogKind = 'pharmacy',
}) {
  const { t } = useTranslation();
  const client = catalogKind === 'pharmacy' ? pharmacySalesApi : returnApi;

  const { data: sale, isPending, isError, error } = useQuery({
    queryKey: ['return-detail', catalogKind, returnId],
    queryFn: () => client.getById(returnId).then((r) => r.data),
    enabled: open && !!returnId,
  });

  if (!open) return null;

  const reason = reasonPreview?.trim() || '—';

  return (
    <div className="ui-modal-overlay z-[70]">
      <div className="ui-modal-panel max-w-2xl">
        <div className="ui-modal-header">
          <h2 className="text-base font-semibold text-ink">{t('returnsModule.detailTitle')}</h2>
          <button type="button" onClick={onClose} className="ui-icon-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="ui-modal-body max-h-[70vh] overflow-y-auto">
          {isPending && <p className="py-8 text-center text-sm text-ink-muted">{t('common.loading')}</p>}
          {isError && (
            <p className="ui-alert-danger">
              {error?.response?.data?.message ?? t('returnsModule.loadError')}
            </p>
          )}
          {sale && (
            <div className="space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <InfoRow label={t('returnsModule.colDate')} value={fmtAt(sale.createdAt)} />
                <InfoRow label={t('returnsModule.colFiscal')} value={sale.receiptNumber} />
                <InfoRow label={t('returnsModule.colStore')} value={sale.storeName ?? '—'} />
                <InfoRow label={t('returnsModule.filters.cashierName')} value={sale.cashierName ?? '—'} />
                <InfoRow label={t('common.status')} value={sale.status} />
                <InfoRow label={t('returnsModule.colReason')} value={reason} />
                <InfoRow
                  label={t('returnsModule.colAmount')}
                  value={fmtMoney(sale.returnAmount ?? sale.totalAmount)}
                />
              </dl>
              {sale.items?.length > 0 && (
                <div className="ui-table-wrap overflow-x-auto">
                  <table className="ui-table text-xs">
                    <thead>
                      <tr>
                        <th className="px-3 py-2">{t('products.colName')}</th>
                        <th className="px-3 py-2 text-right">{t('pos.returnSold')}</th>
                        <th className="px-3 py-2 text-right">{t('pos.returnAlready')}</th>
                        <th className="px-3 py-2 text-right">{t('returnsModule.colAmount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale.items
                        .filter((line) => Number(line.returnedQuantity ?? 0) > 0)
                        .map((line, i) => {
                          const soldQty = Number(line.quantity) || 1;
                          const retQty = Number(line.returnedQuantity) || 0;
                          const unit =
                            line.lineTotal != null && soldQty > 0
                              ? Number(line.lineTotal) / soldQty
                              : Number(line.unitPrice) || 0;
                          return (
                            <tr key={line.id ?? i} className="ui-tr">
                              <td className="px-3 py-2 text-ink">{line.productName || line.productSku || '—'}</td>
                              <td className="px-3 py-2 text-right ui-tabular">{line.quantity}</td>
                              <td className="px-3 py-2 text-right ui-tabular">{retQty}</td>
                              <td className="px-3 py-2 text-right ui-tabular font-medium">{fmtMoney(unit * retQty)}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
