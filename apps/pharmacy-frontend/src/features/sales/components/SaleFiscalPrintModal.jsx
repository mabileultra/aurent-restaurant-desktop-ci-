// src/components/reports/SaleFiscalPrintModal.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Printer, X, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { saleApi, pharmacySalesApi } from '../../../api';
import {
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../../services/cashierEscpos';
import { FiscalReceiptBody, ThermalPrintSettingsPanel } from '../../../components/receipt';

export default function SaleFiscalPrintModal({ saleId, onClose, catalogKind = 'pharmacy' }) {
  const { t } = useTranslation();
  const [printSettingsOpen, setPrintSettingsOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const client = catalogKind === 'pharmacy' ? pharmacySalesApi : saleApi;
  const { data: sale, isPending, isError, error } = useQuery({
    queryKey: ['sale-fiscal', catalogKind, saleId],
    queryFn: () => client.getById(saleId).then((r) => r.data),
    enabled: Boolean(saleId),
  });

  const handlePrint = async () => {
    if (!sale || printing) return;
    setPrinting(true);
    try {
      await printFiscalReceipt({ sale, t, useModalShell: true });
      toast.success(t('receipt.printSent'), { id: 'sale-fiscal-print' });
    } catch (e) {
      toast.error(resolveEscposPrintErrorMessage(e, t) ?? t('receipt.printFailed'), {
        id: 'sale-fiscal-print',
      });
    } finally {
      setPrinting(false);
    }
  };

  if (!saleId) return null;

  return (
    <div
      className="fiscal-print-scene fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="fixed inset-0 bg-ink/45 print:hidden"
        aria-label={t('common.cancel')}
        onClick={onClose}
      />
      <div
        className="fiscal-print-dialog relative z-[1] flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-card border border-line bg-surface shadow-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3 print:hidden">
          <h2 className="text-sm font-semibold text-ink">{t('fiscalReceipt.title')}</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPrintSettingsOpen((o) => !o)}
              className={`inline-flex items-center gap-1 rounded-input border px-2.5 py-1.5 text-xs font-semibold transition ${
                printSettingsOpen
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-line bg-surface text-ink hover:bg-primary-50'
              }`}
              aria-expanded={printSettingsOpen}
            >
              <Settings2 size={14} />
              {t('printSettings.toggleShort')}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!sale || printing}
              className="ui-btn-secondary h-8 px-3 text-xs disabled:opacity-50"
            >
              <Printer size={14} />
              {printing ? t('common.loading') : t('receipt.print')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ui-icon-btn h-8 w-8"
              aria-label={t('common.cancel')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {printSettingsOpen ? (
          <div className="border-b border-line px-4 py-3 print:hidden">
            <ThermalPrintSettingsPanel compact />
          </div>
        ) : null}

        <div
          id="fiscal-print-shell"
          className="overflow-y-auto overflow-x-hidden px-5 py-4 print:overflow-visible print:px-0 print:py-0"
        >
          {isPending && <p className="text-center text-sm text-ink-muted">{t('common.loading')}</p>}
          {isError && (
            <p className="text-center text-sm text-danger-text">
              {error?.response?.data?.message ?? error?.message ?? t('salesLedger.loadError')}
            </p>
          )}
          {sale ? (
            <div className="bg-white text-black">
              <FiscalReceiptBody sale={sale} />
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-4 py-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="ui-btn-secondary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!sale || printing}
            className="ui-btn-primary"
          >
            {printing ? t('common.loading') : t('receipt.print')}
          </button>
        </div>
      </div>
    </div>
  );
}
