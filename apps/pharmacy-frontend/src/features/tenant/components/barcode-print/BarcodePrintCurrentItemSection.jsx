import { Printer } from 'lucide-react';
import { barcodePrintInputCls } from './barcodePrintFormUi';

export default function BarcodePrintCurrentItemSection({
  t,
  draft,
  priceInput,
  onPriceChange,
  onOpenPrint,
}) {
  return (
    <section className="barcode-print-page__card">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-ink">
          {t('usersBarcodePrint.currentItem')}
        </h2>
        {draft ? (
          <span className="ui-badge-success">
            {draft.source === 'catalog' ? t('usersBarcodePrint.sourceCatalog') : t('usersBarcodePrint.sourceTasnif')}
          </span>
        ) : null}
      </div>

      {!draft ? (
        <p className="text-sm text-ink-muted">{t('usersBarcodePrint.currentItemEmpty')}</p>
      ) : (
        <>
          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-xs text-ink-muted">{t('products.colName')}</label>
              <p className="font-medium text-ink">{draft.name}</p>
            </div>
            <div>
              <label className="block text-xs text-ink-muted">{t('productModal.barcode')}</label>
              <p className="ui-tabular text-ink">{draft.barcode || '—'}</p>
            </div>
            {draft.mxik && (
              <div>
                <label className="block text-xs text-ink-muted">{t('productCatalog.ikpu')}</label>
                <p className="ui-tabular text-ink">{draft.mxik}</p>
              </div>
            )}
            <div>
              <label className="block text-xs text-ink-muted">{t('products.colPrice')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${barcodePrintInputCls} max-w-[12rem]`}
                  value={priceInput}
                  onChange={(e) => onPriceChange(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-ink-muted">{t('usersBarcodePrint.priceHint')}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenPrint}
              className="ui-btn ui-btn-primary"
            >
              <Printer size={18} strokeWidth={1.75} aria-hidden />
              {t('usersBarcodePrint.openPrint')}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
