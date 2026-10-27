import { useEffect } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Hash,
  Info,
  MinusCircle,
  Phone,
  PlusCircle,
  Receipt,
  Send,
  Sliders,
  Wallet,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import BillingPaymentsList from '../../../billing/components/BillingPaymentsList';
import BillingCompanyManage from './BillingCompanyManage';
import BillingDeferralBlock from './BillingDeferralBlock';
import { activeDeferralDay, dueHint, initials } from './billingCollectionsUi';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';

const LEDGER_ICON = { TOP_UP: PlusCircle, BONUS: PlusCircle, CHARGE: MinusCircle, MODULE: MinusCircle };

function avatarClass(state) {
  switch (state) {
    case 'ACTIVE':
      return 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400';
    case 'DUE_SOON':
      return 'bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-400';
    case 'OVERDUE':
      return 'bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400';
    case 'SUSPENDED':
      return 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400';
    case 'NOT_BILLED':
    default:
      return 'bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400';
  }
}

function badgeClass(state) {
  switch (state) {
    case 'ACTIVE':
      return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'DUE_SOON':
      return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case 'OVERDUE':
      return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    case 'SUSPENDED':
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    case 'NOT_BILLED':
    default:
      return 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
  }
}

function LedgerTimeline({ p, limit }) {
  const { t, money, formatDate } = p;
  const rows = limit ? p.ledger.slice(0, limit) : p.ledger;
  if (p.ledgerLoading) return <p className="text-xs text-slate-400 py-3 text-center">{t('common.loading')}</p>;
  if (!rows.length) return <p className="text-xs text-slate-400 py-3 text-center">{t('platform.billing.collections.historyEmpty')}</p>;

  return (
    <ul className="space-y-2">
      {rows.map((e) => {
        const positive = Number(e.amount) >= 0;
        const Icon = LEDGER_ICON[e.entryType] || CheckCircle2;
        return (
          <li
            key={e.id}
            className={`flex items-start justify-between gap-3 p-2.5 rounded-xl border text-xs bg-white dark:!bg-slate-800/80 ${
              positive
                ? 'border-emerald-200/80 dark:border-emerald-900/60 border-l-4 border-l-emerald-600'
                : 'border-rose-200/80 dark:border-rose-900/60 border-l-4 border-l-rose-600'
            }`}
          >
            <div className="flex items-start space-x-2.5 min-w-0">
              <div className={`p-1 rounded-lg shrink-0 mt-0.5 ${positive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' : 'text-rose-600 bg-rose-50 dark:bg-rose-950'}`}>
                <Icon size={15} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">
                  {t(`billing.ledgerTypes.${e.entryType}`, { defaultValue: e.entryType })}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {e.paymentMethod ? `${t(`platform.billing.collections.methods.${e.paymentMethod}`)} · ` : ''}
                  {e.description || '—'}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-bold tabular-nums ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {positive ? '+' : ''}{money(e.amount)} {t('billing.currency')}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(e.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function BillingCompanyDrawer({ p }) {
  const { t, money, formatDate, selectedRow: row, selected: b } = p;

  // Escape klavishi orqali yopish
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
    const lines = [
      `Kompaniya: ${b.companyName || ''} (ID: ${b.companyId})`,
      row.companyPhone ? `Telefon: ${row.companyPhone}` : null,
      row.companyTin ? `STIR: ${row.companyTin}` : null,
      `Tarif: ${b.planName || 'Individual'}`,
      `Balans: ${money(b.balance)} ${currency}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
    toast.success("Kompaniya ma'lumotlari nusxalandi!");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={b.companyName}
    >
      {/* Backdrop Blur Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200"
        aria-hidden="true"
        onClick={p.closeDrawer}
      />

      {/* Centered Dialog Box (Stitch Design) */}
      <div
        className="relative w-full max-w-3xl bg-white dark:!bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:!border-slate-800 flex flex-col max-h-[88vh] overflow-hidden transform transition-all duration-200 z-10 select-text"
      >
        {/* Modal Header */}
        <header className="px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:!bg-slate-900">
          <div className="flex items-center space-x-4 min-w-0">
            {/* Avatar Icon */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-extrabold shadow-inner shrink-0 ${avatarClass(row.paymentState)}`}>
              {initials(b.companyName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate leading-tight" title={b.companyName}>
                  {b.companyName || `#${b.companyId}`}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${badgeClass(row.paymentState)}`}>
                  {k(`states.${row.paymentState}`)}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                <span>ID: <strong className="text-slate-600 dark:text-slate-300 font-medium">{b.companyId}</strong></span>
                {(region || district) ? (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="truncate">{[region, district].filter(Boolean).join(', ')}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action tools */}
          <div className="flex items-center space-x-1.5 shrink-0 ml-2">
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              onClick={handleCopyAll}
              title={k('reminder.copy')}
            >
              <Copy size={16} />
            </button>
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
              onClick={p.closeDrawer}
              title={t('common.close')}
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Modal Internal Tabs Navigation */}
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

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {p.drawerTab === 'overview' ? (
            <>
              {/* Section 1: Financial & Subscription Metric Tiles */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Moliyaviy ko'rsatkichlar &amp; Obuna
                  </h4>
                  <button
                    type="button"
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer hover:underline"
                    onClick={() => p.setDrawerTab('manage')}
                  >
                    Tarifni o'zgartirish
                  </button>
                </div>

                {/* 3-Column Metric Grid (Stitch Design) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Metric 1: Joriy tarif */}
                  <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{k('colPlan')}</span>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
                      {b.planName || k('customPlan')}
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                      {b.planName ? 'Cheklovlarsiz funksiyalar' : 'Tarifsiz rejim'}
                    </div>
                  </div>

                  {/* Metric 2: Oylik to'lov */}
                  <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{k('colMonthly')}</span>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {money(b.monthlyTotal)} {currency}
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                      Keyingi oylik reja
                    </div>
                  </div>

                  {/* Metric 3: Joriy balans */}
                  <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{k('currentBalance')}</span>
                    <div className={`text-base font-bold mt-1 ${Number(b.balance) < 0 ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'}`}>
                      {money(b.balance)} {currency}
                    </div>
                    <div className="mt-2 text-[10px] font-medium">
                      {Number(b.balance) < 0 ? (
                        <span className="text-rose-600">Qarzdorlik mavjud</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">Qarzdorlik yo'q</span>
                      )}
                    </div>
                  </div>

                  {/* Metric 4: Keyingi to'lov */}
                  <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{k('colNext')}</span>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {formatDate(b.nextChargeAt) || '—'}
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                      {dueHint(row, t)?.text || (b.nextChargeAt ? '' : 'Muddati belgilanmagan')}
                    </div>
                  </div>

                  {/* Metric 5: Qo'shilgan sana */}
                  <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{k('registeredAt')}</span>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {formatDate(row.companyCreatedAt) || '—'}
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                      Platforma a'zosi
                    </div>
                  </div>

                  {/* Metric 6: Oxirgi to'lov */}
                  <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{k('lastPayment')}</span>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {row.lastPaymentMethod ? k(`methods.${row.lastPaymentMethod}`) : '—'}
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                      {row.lastPaymentAt ? formatDate(row.lastPaymentAt) : "To'lovlar mavjud emas"}
                    </div>
                  </div>
                </div>

                {/* Faol kechiktirish (agar bo'lsa) */}
                {activeDeferralDay(b) ? (
                  <div className="mt-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                    <div className="font-bold flex items-center space-x-1.5">
                      <span>{k('deferral.title')}:</span>
                      <span>{k('deferral.until', { date: formatDate(activeDeferralDay(b)) })}</span>
                    </div>
                    {b.deferralReason ? (
                      <div className="mt-1 text-[11px] text-blue-600/80 dark:text-blue-400">{b.deferralReason}</div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* Section 2: Contact Details & Requisites */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  Rekvizitlar va Aloqa
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Telefon raqam */}
                  <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:!bg-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Phone size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{k('phone')}</span>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {row.companyPhone || '—'}
                        </div>
                      </div>
                    </div>
                    {row.companyPhone ? (
                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => handleCopy(row.companyPhone, k('phone'))}
                        title={k('reminder.copy')}
                      >
                        <Copy size={14} />
                      </button>
                    ) : null}
                  </div>

                  {/* STIR / INN */}
                  <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:!bg-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Hash size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{k('tin')}</span>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {row.companyTin || '—'}
                        </div>
                      </div>
                    </div>
                    {row.companyTin ? (
                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => handleCopy(row.companyTin, k('tin'))}
                        title={k('reminder.copy')}
                      >
                        <Copy size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Section 3: Recent Operations / History State */}
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

                {p.ledgerLoading ? (
                  <p className="text-xs text-slate-400 py-4 text-center">{t('common.loading')}</p>
                ) : (!p.ledger || p.ledger.length === 0) ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mb-2">
                      <Receipt size={20} />
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Hozircha operatsiyalar yo'q
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                      Ushbu kompaniya uchun hali hech qanday to'lov yoki debitorlik yozuvi kiritilmagan.
                    </p>
                  </div>
                ) : (
                  <LedgerTimeline p={p} limit={3} />
                )}
              </div>
            </>
          ) : null}

          {p.drawerTab === 'payments' ? (
            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-3">{k('historyTitle')}</h4>
                <LedgerTimeline p={p} />
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-3">{k('onlinePayments')}</h4>
                <BillingPaymentsList
                  t={t}
                  money={money}
                  formatDateTime={p.formatDateTime}
                  rows={p.companyPayments}
                  loading={p.companyPaymentsLoading}
                />
              </div>
            </div>
          ) : null}

          {p.drawerTab === 'manage' ? (
            <div className="space-y-5">
              <BillingDeferralBlock key={b.companyId} p={p} />
              <BillingCompanyManage p={p} />
            </div>
          ) : null}
        </div>

        {/* Modal Action Footer (Sticky bottom) */}
        <footer className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:!bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Quick Communication button */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-semibold text-xs shadow-sm transition-colors"
              onClick={() => p.actions.remindTelegram(row)}
              disabled={!row.companyPhone}
              title={row.companyPhone ? undefined : k('reminder.noPhone')}
            >
              <Send size={15} />
              <span>{k('reminder.telegram')}</span>
            </button>
            <button
              type="button"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={handleCopyAll}
              title="Barcha ma'lumotlarni nusxalash"
            >
              <Copy size={16} />
            </button>
          </div>

          {/* Primary Decision Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs transition-colors"
              onClick={p.closeDrawer}
            >
              {t('common.cancel', { defaultValue: 'Bekor qilish' })}
            </button>
            <button
              type="button"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-md shadow-emerald-900/10 transition-colors"
              onClick={() => p.openPaymentModal(b.companyId, { returnToDrawer: true })}
            >
              <Wallet size={16} />
              <span>{k('acceptPayment')}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
