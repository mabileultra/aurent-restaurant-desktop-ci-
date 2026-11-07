import React from 'react';
import '../styles/analytics.css';
import { AlertCircle, Download, RotateCcw, Search } from 'lucide-react';
import AnalyticsHeader from '../components/AnalyticsHeader';
import AnalyticsReceiptDetailCard from '../components/AnalyticsReceiptDetailCard';
import AnalyticsReceiptsTable from '../components/AnalyticsReceiptsTable';
import AnalyticsTablePager from '../components/AnalyticsTablePager';
import { useAnalyticsReceiptsPage } from '../hooks/useAnalyticsReceiptsPage';
import { exportToCsv } from '../utils/analyticsExport';
import { fmtDayFull, fmtMoney, sanitizeText } from '../utils/analyticsFormat';
import PlatformSelect from '../../platform/components/PlatformSelect';

export default function AnalyticsReceiptsPage() {
  const flow = useAnalyticsReceiptsPage();

  const handleExport = () => {
    const headers = ['Chek raqami', 'Sana / Vaqt', 'Korxona', 'Do‘kon', 'Summa', 'Fiskal / QR holati'];
    const rows = flow.filteredReceipts.map((r) => [
      r.receiptNumber || r.saleId || 'Chek',
      r.createdAt || r.date || flow.effectiveDay || '—',
      sanitizeText(r.companyName || flow.activeCompany?.name || 'Korxona'),
      r.storeName || 'Asosiy do‘kon',
      fmtMoney(r.totalAmount || r.amount || 0),
      (r.hasQr || r.fiscalStatus === 'FISCAL') ? 'QR bilan' : 'QR’siz',
    ]);
    exportToCsv(`cheklar-${flow.effectiveDay || 'barchasi'}`, headers, rows);
  };

  return (
    <div className="an-shell">
      <AnalyticsHeader
        period={flow.page.period}
        setPeriod={flow.page.setPeriod}
        customFrom={flow.page.customFrom}
        customTo={flow.page.customTo}
        onCustomChange={flow.page.handleCustomDateChange}
      />

      <main className="an-main">
        {flow.receiptsQuery.isError && (
          <div role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 16px', marginBottom: '16px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#991B1B', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>Cheklarni yuklashda xatolik yuz berdi. Iltimos qayta urinib ko‘ring.</span>
            </div>
            <button type="button" onClick={() => flow.receiptsQuery.refetch()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: '#fff', border: '1px solid #FCA5A5', color: '#991B1B', fontWeight: 600, cursor: 'pointer', fontSize: '12.5px' }}>
              <RotateCcw size={14} /> Qayta yuklash
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
          <PlatformSelect
            value={flow.selectedCompanyId || ''}
            onChange={(e) => flow.setSelectedCompanyId(e.target.value ? Number(e.target.value) : '')}
            options={[
              { value: '', label: 'Barcha korxonalar' },
              ...flow.page.top10Companies.map((c) => ({
                value: c.companyId,
                label: `${sanitizeText(c.name)} (${fmtMoney(c.totalTurnover, { showCurrency: false })})`,
              })),
            ]}
            size="sm"
            theme="blue"
            searchable
            style={{ width: 'auto', minWidth: 220 }}
            ariaLabel="Firma tanlash"
          />

          {flow.availableDays.length > 0 && (
            <PlatformSelect
              value={flow.effectiveDay}
              onChange={(e) => flow.setSelectedDayOverride(e.target.value)}
              options={flow.availableDays.map((d) => ({
                value: d.date,
                label: `${fmtDayFull(d.date)} (${fmtMoney(d.totalTurnover, { showCurrency: false })})`,
              }))}
              size="sm"
              theme="blue"
              searchable={false}
              style={{ width: 'auto', minWidth: 200 }}
              ariaLabel="Sana tanlash"
            />
          )}

          <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #E5E9EE', borderRadius: 9, padding: '0 12px', height: 34 }}>
            <Search size={14} color="#94A3B8" />
            <input
              type="text"
              value={flow.search}
              onChange={(e) => flow.setSearch(e.target.value)}
              placeholder="Chek raqami, do‘kon yoki korxona..."
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12.5px', width: '100%', color: '#1F2937' }}
            />
          </div>

          <div className="seg" role="group" aria-label="QR filtri">
            <button type="button" className={flow.qrFilter === 'all' ? 'on' : ''} onClick={() => flow.setQrFilter('all')}>Barchasi</button>
            <button type="button" className={flow.qrFilter === 'qr' ? 'on' : ''} onClick={() => flow.setQrFilter('qr')}>QR bilan</button>
            <button type="button" className={flow.qrFilter === 'no_qr' ? 'on' : ''} onClick={() => flow.setQrFilter('no_qr')}>QR’siz</button>
          </div>

          <button type="button" className="btn" onClick={handleExport}>
            <Download size={14} style={{ color: '#2563EB' }} />
            <span>Excel / CSV</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="card" style={{ flex: '3 1 600px', minWidth: 0, padding: '16px 18px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h2 className="t">Real cheklar ro‘yxati</h2>
                <p className="s">
                  {sanitizeText(flow.activeCompany?.name || 'Barcha korxonalar')}
                  {' · '}
                  {flow.effectiveDay ? fmtDayFull(flow.effectiveDay) : 'Sana tanlanmagan'}
                  {' · '}
                  {flow.filteredReceipts.length} ta chek
                </p>
              </div>
            </div>

            <AnalyticsReceiptsTable
              receipts={flow.filteredReceipts}
              loading={flow.receiptsQuery.isLoading}
              selectedReceipt={flow.selectedReceipt}
              onSelectReceipt={flow.setSelectedReceipt}
              effectiveDay={flow.effectiveDay}
            />
            <AnalyticsTablePager
              page={flow.listPage}
              pageSize={flow.pageSize}
              totalElements={flow.totalElements}
              onPageChange={flow.setListPage}
            />
          </div>

          <AnalyticsReceiptDetailCard
            receipt={flow.selectedReceipt}
            companyId={flow.detailCompanyId}
            effectiveDay={flow.effectiveDay}
            onClose={() => flow.setSelectedReceipt(null)}
          />
        </div>
      </main>
    </div>
  );
}
