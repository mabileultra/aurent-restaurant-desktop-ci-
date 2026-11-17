import { Printer, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ShelfLabelPrintSettingsPanel from './ShelfLabelPrintSettingsPanel';
import { CopiesStepper, ToggleSwitch, VariantTabs } from './ShelfLabelPrintControls';
import ShelfLabelSheet from './ShelfLabelSheet';
import { useShelfLabelPrint } from './useShelfLabelPrint';
import { useLabelPrintLayoutSettings } from './useLabelPrintLayoutSettings';

/**
 * Модалка этикетки / ценника. Печать — ESC/POS как чек / Z / X (printShelfLabel).
 */
export default function ShelfLabelPrintModal({
  open,
  onClose,
  productName,
  barcode,
  price,
  autoLabelPrint = false,
  defaultVariant = 'label',
  showInlineSettings = false,
}) {
  const { t } = useTranslation();
  const layoutSettings = useLabelPrintLayoutSettings();
  const state = useShelfLabelPrint({
    open,
    productName,
    barcode,
    price,
    autoLabelPrint,
    defaultVariant,
    layoutSettings,
  });

  if (!open) return null;

  const formatMm = (n) => Number(n).toFixed(n % 1 ? 2 : 0);

  return (
    <div className="shelflabel-no-print-wrap fixed inset-0 z-[100] flex items-end justify-center bg-ink/45 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="shelf-label-title"
        className="relative flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-card bg-surface shadow-modal sm:rounded-card border border-line"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5">
          <h2 id="shelf-label-title" className="text-base font-semibold text-ink">
            {t('usersBarcodePrint.modalTitle')}
          </h2>
          <button
            type="button"
            className="ui-icon-btn"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="border-b border-line px-5 py-3">
          <VariantTabs
            variant={state.variant}
            onChange={state.setVariant}
            labelTab={t('usersBarcodePrint.tabLabel')}
            priceTagTab={t('usersBarcodePrint.tabPriceTag')}
          />
        </div>

        <div className="grow overflow-y-auto px-5">
          <ToggleSwitch label={t('usersBarcodePrint.showName')} checked={state.showName} onChange={state.setShowName} />
          <ToggleSwitch
            label={t('usersBarcodePrint.showBarcode')}
            checked={state.showBarcode}
            onChange={state.setShowBarcode}
          />
          <ToggleSwitch label={t('usersBarcodePrint.showPrice')} checked={state.showPrice} onChange={state.setShowPrice} />

          <div className="shelflabel-preview-wrap my-4 rounded-card border border-line bg-white p-3">
            <ShelfLabelSheet {...state.sheetProps} />
          </div>

          <ToggleSwitch
            label={t('usersBarcodePrint.autoPaperSizeToggle', {
              defaultValue: 'Подобрать размер автоматически',
            })}
            checked={state.autoSizeEnabled}
            onChange={state.setAutoSizeEnabled}
          />

          {state.autoSizeEnabled ? (
            <div className="mb-4 mt-3 rounded-card border border-primary-200 bg-primary-50 px-3 py-2.5 text-center text-sm text-primary-900">
              <p className="ui-tabular">
                {t('usersBarcodePrint.autoPaperSize', {
                  defaultValue: 'Размер бумаги подобран автоматически: {{w}} × {{h}} мм',
                  w: formatMm(state.layout.paperWmm),
                  h: formatMm(state.layout.paperHmm),
                })}
              </p>
              {state.activePreset ? (
                <p className="mt-1 text-xs opacity-90">{t(state.activePreset.i18nKey)}</p>
              ) : null}
            </div>
          ) : showInlineSettings ? null : (
            <div className="mb-4 mt-3">
              <ShelfLabelPrintSettingsPanel
                t={t}
                layout={layoutSettings.layout}
                patchLayout={state.patchLayout}
                maxPadXmm={state.maxPadXmm}
                maxPadYmm={state.maxPadYmm}
                applyPreset={state.applyPreset}
                resetPresetDefaults={state.resetPresetDefaults}
                compact
              />
            </div>
          )}

          <CopiesStepper
            label={t('usersBarcodePrint.copies')}
            copies={state.copies}
            onChange={state.setCopies}
            onBump={state.bumpCopies}
          />
        </div>

        <footer className="shrink-0 border-t border-line p-4">
          <button
            type="button"
            disabled={state.printing}
            onClick={() => void state.tryPrint()}
            className="ui-btn-primary w-full h-11 text-sm"
          >
            <Printer size={18} className="mr-1 inline-block" aria-hidden />
            {state.printing
              ? t('common.loading', { defaultValue: 'Печать…' })
              : t('usersBarcodePrint.print')}
          </button>
        </footer>
      </div>
    </div>
  );
}
