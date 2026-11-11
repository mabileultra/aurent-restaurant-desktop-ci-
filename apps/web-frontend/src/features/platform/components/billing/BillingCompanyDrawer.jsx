import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Info, Receipt, Sliders } from 'lucide-react';
import toast from 'react-hot-toast';
import BillingPaymentsList from '../../../billing/components/BillingPaymentsList';
import BillingCompanyManage from './BillingCompanyManage';
import BillingDeferralBlock from './BillingDeferralBlock';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';
import BillingCompanyDrawerHeader from './BillingCompanyDrawerHeader';
import BillingCompanyDrawerMetrics from './BillingCompanyDrawerMetrics';
import BillingCompanyDrawerRequisites from './BillingCompanyDrawerRequisites';
import { LedgerTimeline } from './BillingCompanyDrawerLedger';

export default function BillingCompanyDrawer({ p }) {
  const { t, money, formatDate, selectedRow: row, selected: b } = p;

  useEffect(() => {
    if (!row) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') p.closeDrawer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [row, p]);

  const { regionName, districtName } = useGeoNameLookup(row?.regionCode ? [row.regionCode] : []);

  if (!row || !b || p.paymentModalOpen) return null;

  const k = (key, opts) => t(`platform.billing.collections.${key}`, opts);
  const currency = t('billing.currency');

  const region = regionName(row.regionCode);
  const district = districtName(row.districtCode);

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    toast.success(`${label || ''} nusxalandi!`);
  };

  const handleCopyAll = () => {
    const detail = p.companyDetail || {};
    const tin = row.companyTin || row.tin || detail.tin || row.company?.tin || b?.tin;
    const phone = row.companyPhone || row.phone || detail.phone || row.company?.phone || b?.phone;
    const lines = [
      `Kompaniya: ${b.companyName || ''} (ID: ${b.companyId})`,
      phone ? `Telefon: ${phone}` : null,
      tin ? `STIR: ${tin}` : null,
      `Tarif: ${b.planName || 'Individual'}`,
      `Balans: ${money(b.balance)} ${currency}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
    toast.success("Kompaniya ma'lumotlari nusxalandi!");
  };

  const dialogNode = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={b.companyName}
    >
      <div
        className="fixed inset-0 bg-slate-900/60 transition-opacity duration-200"
        aria-hidden="true"
        onClick={p.closeDrawer}
      />

      <div className="relative w-full max-w-3xl bg-white dark:!bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:!border-slate-800 flex flex-col max-h-[88vh] overflow-hidden transform transition-all duration-200 z-10 select-text">
        <BillingCompanyDrawerHeader
          p={p}
          row={row}
          b={b}
          region={region}
          district={district}
          k={k}
          onCopyAll={handleCopyAll}
        />

        <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex space-x-6 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-medium shrink-0">
          <button
            type="button"
            className={`py-3.5 flex items-center space-x-1.5 transition-colors border-b-2 ${
              p.drawerTab === 'overview'
                ? 'font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
            }`}
            onClick={() => p.setDrawerTab('overview')}
          >
            <Info size={14} />
            <span>{k('drawerTabs.overview')}</span>
          </button>
          <button
            type="button"
            className={`py-3.5 flex items-center space-x-1.5 transition-colors border-b-2 ${
              p.drawerTab === 'payments'
                ? 'font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
            }`}
            onClick={() => p.setDrawerTab('payments')}
          >
            <Receipt size={14} />
            <span>{k('drawerTabs.payments')}</span>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-full">
              {p.ledger?.length || 0}
            </span>
          </button>
          <button
            type="button"
            className={`py-3.5 flex items-center space-x-1.5 transition-colors border-b-2 ${
              p.drawerTab === 'manage'
                ? 'font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
            }`}
            onClick={() => p.setDrawerTab('manage')}
          >
            <Sliders size={14} />
            <span>{k('drawerTabs.manage')}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {p.drawerTab === 'overview' ? (
            <>
              <BillingCompanyDrawerMetrics p={p} row={row} b={b} k={k} currency={currency} />
              <BillingCompanyDrawerRequisites p={p} row={row} b={b} k={k} onCopy={handleCopy} />
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{k('historyTitle')}</span>
                  <button
                    type="button"
                    className="text-xs text-emerald-700 dark:text-emerald-400 font-medium hover:underline inline-flex items-center space-x-1"
                    onClick={() => p.setDrawerTab('payments')}
                  >
                    <span>{k('seeAll')}</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
                <LedgerTimeline p={p} limit={3} />
              </div>
            </>
          ) : null}

          {p.drawerTab === 'payments' ? (
            <div className="space-y-4">
              <BillingPaymentsList
                t={t}
                payments={p.companyPayments || []}
                loading={p.companyPaymentsLoading}
                money={money}
                currency={currency}
              />
            </div>
          ) : null}

          {p.drawerTab === 'manage' ? (
            <div className="space-y-6">
              <BillingCompanyManage p={p} />
              <BillingDeferralBlock p={p} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(dialogNode, document.body);
  }
  return dialogNode;
}

