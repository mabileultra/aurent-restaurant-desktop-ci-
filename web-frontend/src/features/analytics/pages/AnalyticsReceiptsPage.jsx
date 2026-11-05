import React, { useMemo, useState } from 'react';
import '../styles/analytics.css';
import { AlertCircle, Download, RotateCcw, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import AnalyticsHeader from '../components/AnalyticsHeader';
import AnalyticsReceiptDetailCard from '../components/AnalyticsReceiptDetailCard';
import AnalyticsReceiptsTable from '../components/AnalyticsReceiptsTable';
import { analyticsApi } from '../api/analyticsApi';
import { useAnalyticsOverview } from '../hooks/useAnalyticsOverview';
import { exportToCsv } from '../utils/analyticsExport';
import { fmtDayFull, fmtMoney, sanitizeText } from '../utils/analyticsFormat';
import PlatformSelect from '../../platform/components/PlatformSelect';

export default function AnalyticsReceiptsPage() {
  const page = useAnalyticsOverview();
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedDayOverride, setSelectedDayOverride] = useState('');
  const [search, setSearch] = useState('');
  const [qrFilter, setQrFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const activeCompanyId = selectedCompanyId || page.top10Companies[0]?.companyId;

  const companyDetailQuery = useQuery({
    queryKey: ['analytics-receipts-company-detail', activeCompanyId],
    queryFn: () => analyticsApi.getCompanyDetail(activeCompanyId).then((res) => res.data),
    enabled: Boolean(activeCompanyId),
  });

  const availableDays = useMemo(() => {
    const list = companyDetailQuery.data?.days ?? [];
    return [...list].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }, [companyDetailQuery.data?.days]);

  const effectiveDay = useMemo(() => {
    if (selectedDayOverride) return selectedDayOverride;
    const withSales = availableDays.filter((d) => Number(d.totalTurnover || 0) > 0);
    return withSales[0]?.date || availableDays[0]?.date || '';
  }, [selectedDayOverride, availableDays]);

  const receiptsQuery = useQuery({
    queryKey: ['analytics-all-receipts', activeCompanyId, effectiveDay],
    queryFn: () => analyticsApi.getCompanyReceipts(activeCompanyId, { date: effectiveDay, size: 100 }).then((res) => res.data?.rows ?? []),
    enabled: Boolean(activeCompanyId && effectiveDay),
  });

  const rawReceipts = receiptsQuery.data ?? [];

  const filteredReceipts = useMemo(() => {
    return rawReceipts.filter((r) => {
      const receiptNo = String(r.receiptNumber || r.receiptNo || r.saleId || '');
      const store = String(r.storeName || r.store || '');
      const matchSearch = !search || receiptNo.toLowerCase().includes(search.toLowerCase()) || store.toLowerCase().includes(search.toLowerCase());
      const hasQr = r.hasQr || r.fiscalStatus === 'FISCAL' || r.fiscalStatus === 'CONFIRMED';
      const matchQr = qrFilter === 'all' ? true : qrFilter === 'qr' ? hasQr : !hasQr;
      return matchSearch && matchQr;
    });
  }, [rawReceipts, search, qrFilter]);

  const activeCompany = page.top10Companies.find((c) => c.companyId === activeCompanyId);

  const handleExport = () => {
    const headers = ['Chek raqami', 'Sana / Vaqt', 'Korxona', 'Do‘kon', 'Summa', 'Fiskal / QR holati'];
    const rows = filteredReceipts.map((r) => [
      r.receiptNumber || r.saleId || 'Chek',
      r.createdAt || r.date || effectiveDay || '—',
      sanitizeText(activeCompany?.name || 'Korxona'),
      r.storeName || 'Asosiy do‘kon',
      fmtMoney(r.totalAmount || r.amount || 0),
      (r.hasQr || r.fiscalStatus === 'FISCAL') ? 'QR bilan' : 'QR’siz',
    ]);
    exportToCsv(`cheklar-${activeCompanyId || 'barchasi'}`, headers, rows);
  };

  return (
    <div className="an-shell">
      <AnalyticsHeader
        period={page.period}
        setPeriod={page.setPeriod}
        customFrom={page.customFrom}
        customTo={page.customTo}
        onCustomChange={page.handleCustomDateChange}
      />

      <main className="an-main">
        {receiptsQuery.isError && (
          <div role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 16px', marginBottom: '16px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#991B1B', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>Cheklarni yuklashda xatolik yuz berdi. Iltimos qayta urinib ko‘ring.</span>
            </div>
            <button type="button" onClick={() => receiptsQuery.refetch()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: '#fff', border: '1px solid #FCA5A5', color: '#991B1B', fontWeight: 600, cursor: 'pointer', fontSize: '12.5px' }}>
              <RotateCcw size={14} /> Qayta yuklash
            </button>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
          {page.top10Companies.length > 0 && (
            <PlatformSelect
              value={activeCompanyId || ''}
              onChange={(e) => {
                setSelectedCompanyId(Number(e.target.value));
                setSelectedDayOverride('');
                setSelectedReceipt(null);
              }}
              options={page.top10Companies.map((c) => ({
                value: c.companyId,
                label: `${sanitizeText(c.name)} (${fmtMoney(c.totalTurnover, { showCurrency: false })})`,
              }))}
              size="sm"
              theme="blue"
              searchable
              style={{ width: 'auto', minWidth: 220 }}
              ariaLabel="Firma tanlash"
            />
          )}

          {availableDays.length > 0 && (
            <PlatformSelect
              value={effectiveDay}
              onChange={(e) => setSelectedDayOverride(e.target.value)}
              options={availableDays.map((d) => ({
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chek raqami yoki do‘kon nomi..."
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12.5px', width: '100%', color: '#1F2937' }}
            />
          </div>

          <div className="seg" role="group" aria-label="QR filtri">
            <button type="button" className={qrFilter === 'all' ? 'on' : ''} onClick={() => setQrFilter('all')}>Barchasi</button>
            <button type="button" className={qrFilter === 'qr' ? 'on' : ''} onClick={() => setQrFilter('qr')}>QR bilan</button>
            <button type="button" className={qrFilter === 'no_qr' ? 'on' : ''} onClick={() => setQrFilter('no_qr')}>QR’siz</button>
          </div>

          <button type="button" className="btn" onClick={handleExport}>
            <Download size={14} style={{ color: '#2563EB' }} />
            <span>Excel / CSV</span>
          </button>
        </div>

        {/* Content: Table & Detail Drawer */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="card" style={{ flex: '3 1 600px', minWidth: 0, padding: '16px 18px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h2 className="t">Real cheklar ro‘yxati</h2>
                <p className="s">{sanitizeText(activeCompany?.name || 'Korxona')} · {effectiveDay ? fmtDayFull(effectiveDay) : 'Sana tanlanmagan'} · {filteredReceipts.length} ta chek</p>
              </div>
            </div>

            <AnalyticsReceiptsTable
              receipts={filteredReceipts}
              loading={receiptsQuery.isLoading}
              selectedReceipt={selectedReceipt}
              onSelectReceipt={setSelectedReceipt}
              effectiveDay={effectiveDay}
            />
          </div>

          <AnalyticsReceiptDetailCard
            receipt={selectedReceipt}
            effectiveDay={effectiveDay}
            onClose={() => setSelectedReceipt(null)}
          />
        </div>
      </main>
    </div>
  );
}
