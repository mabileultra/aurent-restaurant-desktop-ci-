import { useState } from 'react';
import toast from 'react-hot-toast';
import { platformBillingApi } from '../../../api';
import { downloadSpreadsheet } from '../../../utils/downloadSpreadsheet';
import { downloadCollectionsCsv } from '../utils/billingCollectionsCsv';
import { buildReminderText, copyText, telegramLink } from '../utils/billingReminder';

const BULK_SKIP_STATES = new Set(['SUSPENDED', 'NOT_BILLED']);

export function useBillingCollectionActions({ t, i18n, money, formatDate, collections, invalidate }) {
  const [bulkMode, setBulkMode] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const k = (key, opts) => t(`platform.billing.collections.${key}`, opts);
  const ctx = { t, money, formatDate };

  const remindTelegram = async (row) => {
    const link = telegramLink(row.companyPhone);
    if (!link) {
      toast.error(k('reminder.noPhone'));
      return;
    }
    const copied = await copyText(buildReminderText(row, ctx));
    window.open(link, '_blank', 'noopener');
    toast.success(copied ? k('reminder.copiedOpen') : k('reminder.openedOnly'));
  };

  const copyReminder = async (row) => {
    const ok = await copyText(buildReminderText(row, ctx));
    toast[ok ? 'success' : 'error'](ok ? k('reminder.copied') : t('platform.billing.actionFailed'));
  };

  const copyBulkReminders = async () => {
    const text = collections.selectedRows
      .map((row) => `${row.companyPhone || '—'}\n${buildReminderText(row, ctx)}`)
      .join('\n\n————————\n\n');
    const ok = await copyText(text);
    toast[ok ? 'success' : 'error'](
      ok ? k('reminder.bulkCopied', { count: collections.selectedRows.length }) : t('platform.billing.actionFailed'),
    );
  };

  const exportExcel = async (selectedOnly) => {
    setExporting(true);
    try {
      const ids = selectedOnly ? [...collections.selectedIds].join(',') : undefined;
      const params = selectedOnly ? { ids } : collections.params;
      const res = await platformBillingApi.collectionsExport({
        ...params,
        lang: i18n.language?.startsWith('uz') ? 'uz' : 'ru',
      });
      downloadSpreadsheet(res.data, 'billing');
    } catch (e) {
      toast.error(e?.response?.data?.message || t('platform.billing.actionFailed'));
    } finally {
      setExporting(false);
    }
  };

  const exportCsv = (selectedOnly) => downloadCollectionsCsv(
    selectedOnly ? collections.selectedRows : collections.rows,
    ctx,
  );

  const bulkTargets = collections.selectedRows.filter((r) => !BULK_SKIP_STATES.has(r.paymentState));

  /** Каждая компания — свой assignPlan; дата периода не меняется при смене тарифа. */
  const runBulk = async (buildPayload) => {
    setBulkBusy(true);
    const results = await Promise.allSettled(
      bulkTargets.map((row) => platformBillingApi.assignPlan(row.billing.companyId, buildPayload(row.billing))),
    );
    setBulkBusy(false);
    const failed = results.filter((r) => r.status === 'rejected').length;
    const done = results.length - failed;
    if (done) toast.success(k('bulk.done', { count: done }));
    if (failed) toast.error(k('bulk.failed', { count: failed }));
    setBulkMode(null);
    collections.clearSelection();
    invalidate();
  };

  const bulkChangePlan = (plan) => runBulk((b) => ({
    planId: plan.id,
    addonMonthlyAmount: 0,
    periodStartOn: b.periodStartOn || undefined,
  }));

  const bulkChangeDate = (isoDate) => runBulk((b) => ({
    planId: b.planId || null,
    addonMonthlyAmount: Number(b.addonMonthlyAmount || 0),
    periodStartOn: isoDate,
  }));

  return {
    remindTelegram,
    copyReminder,
    copyBulkReminders,
    exportExcel,
    exportCsv,
    exporting,
    bulkMode,
    openBulk: setBulkMode,
    closeBulk: () => setBulkMode(null),
    bulkBusy,
    bulkTargets,
    bulkSkipped: collections.selectedRows.length - bulkTargets.length,
    bulkChangePlan,
    bulkChangeDate,
  };
}
