import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from '../../../../components/ui/BaseModal';
import { CompanyAnalyticsPager } from './CompanyAnalyticsTable';
import { fmtDay, fmtMoney } from './analyticsFormat';
import { splitDateTime } from '../../../../utils/fiscalReceiptFormat';
import { useCompanyDayReceipts } from '../../hooks/useCompanyDayReceipts';
import CompanyDayReceiptView from './CompanyDayReceiptView';

const KIND_KEY = {
  ALL: 'platform.analytics.receiptsAll',
  QR: 'platform.analytics.receiptsQr',
  NO_QR: 'platform.analytics.receiptsNoQr',
};

export default function CompanyDayReceiptsModal({ companyId, date, onClose }) {
  const { t } = useTranslation();
  const list = useCompanyDayReceipts(companyId, date);
  const title = list.saleId
    ? (list.receipt?.receiptNumber || t('platform.analytics.receiptPunched'))
    : t('platform.analytics.receiptsTitle', { date: fmtDay(date) });

  return (
    <BaseModal open title={title} onClose={onClose} size="xl" className="ta-page">
      {list.saleId ? (
        <div className="ca-receipt-modal">
          <button type="button" className="ca-back" onClick={list.closeReceipt}>
            {t('platform.analytics.receiptsBack')}
          </button>
          {list.receiptLoading ? <p className="ta-muted">{t('common.loading')}</p> : null}
          {list.receiptError ? <p className="ta-muted">{t('platform.analytics.loadFailed')}</p> : null}
          {list.receipt ? <CompanyDayReceiptView receipt={list.receipt} /> : null}
        </div>
      ) : (
        <>
          <div className="ta-period ca-receipt-kinds">
            {list.kinds.map((kind) => (
              <button
                key={kind}
                type="button"
                className={`ta-period__btn${list.kind === kind ? ' is-active' : ''}`}
                onClick={() => list.setKind(kind)}
              >
                {t(KIND_KEY[kind])}
              </button>
            ))}
          </div>
          <div className="ta-table-wrap">
            <table className="ta-table">
              <thead>
                <tr>
                  <th>{t('platform.analytics.colReceipt')}</th>
                  <th>{t('platform.analytics.colTime')}</th>
                  <th>{t('platform.analytics.colStores')}</th>
                  <th>{t('platform.analytics.colTotalTurnover')}</th>
                  <th>{t('platform.analytics.colReceiptQr')}</th>
                </tr>
              </thead>
              <tbody>
                {list.loading ? (
                  <tr><td colSpan={5} className="ta-muted">{t('common.loading')}</td></tr>
                ) : list.error ? (
                  <tr><td colSpan={5} className="ta-muted">{t('platform.analytics.loadFailed')}</td></tr>
                ) : list.rows.length ? list.rows.map((row) => {
                  const clock = splitDateTime(row.createdAt);
                  return (
                    <tr key={row.saleId} className="ca-day-row" onClick={() => list.openReceipt(row.saleId)}>
                      <td>{row.receiptNumber || '—'}</td>
                      <td>{clock.time}</td>
                      <td>{row.storeName || '—'}</td>
                      <td>{fmtMoney(row.totalAmount)}</td>
                      <td>{row.hasQr ? t('platform.analytics.receiptsQr') : t('platform.analytics.receiptsNoQr')}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={5} className="ta-muted">{t('platform.analytics.receiptsEmpty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <CompanyAnalyticsPager
            t={t}
            page={list.page}
            size={list.size}
            total={list.total}
            pageSizes={list.pageSizes}
            onPage={list.setPage}
            onSize={list.setSize}
          />
        </>
      )}
    </BaseModal>
  );
}
