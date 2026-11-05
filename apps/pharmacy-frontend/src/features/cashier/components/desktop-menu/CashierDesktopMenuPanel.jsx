import {
  Barcode,
  Download,
  FileText,
  LogOut,
  Maximize,
  Menu,
  Printer,
  RefreshCw,
  Scale,
  Server,
  Tag,
  X,
} from 'lucide-react';
import CashierDesktopMenuConnectivity from './CashierDesktopMenuConnectivity';
import CashierFiscalTheme from '../../../fiscal/CashierFiscalTheme';

export default function CashierDesktopMenuPanel({
  menu,
  embedded = false,
}) {
  const {
    t,
    rootRef,
    open,
    setOpen,
    run,
    toggleFullscreen,
    printerLabel,
    labelPrinterLabel,
    scaleLabel,
    openPrinterPicker,
    openLabelPicker,
    runTestPrint,
    openScalePicker,
    openBarcodePage,
    checkAppUpdates,
    openServerSetup,
    reloadUi,
    reloadingUi,
  } = menu;

  return (
    <div
      ref={rootRef}
      className={`cashier-desktop-menu${open || embedded ? ' is-open' : ''}${embedded ? ' is-embedded' : ''}`}
    >
      {embedded ? null : (
      <button
        type="button"
        className="cashier-desktop-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? t('common.close', { defaultValue: 'Закрыть' }) : t('desktop.menu', { defaultValue: 'Меню' })}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <X size={20} strokeWidth={2.5} className="cashier-desktop-menu__burger" aria-hidden />
        ) : (
          <Menu size={20} strokeWidth={2.5} className="cashier-desktop-menu__burger" aria-hidden />
        )}
      </button>
      )}
      <div className="cashier-desktop-menu__panel" role="menu">
        <button
          type="button"
          className="cashier-desktop-menu__item"
          role="menuitem"
          onClick={openServerSetup}
        >
          <Server size={15} strokeWidth={2} aria-hidden />
          <span>{t('desktop.serverSetup')}</span>
        </button>

        <CashierDesktopMenuConnectivity t={t} />

        <CashierFiscalTheme variant="menu" t={t} />

        <div className="cashier-desktop-menu__sep" role="separator" />
        <button
          type="button"
          className="cashier-desktop-menu__item cashier-desktop-menu__item--stacked"
          role="menuitem"
          onClick={openPrinterPicker}
        >
          <Printer size={15} strokeWidth={2} aria-hidden />
          <span className="cashier-desktop-menu__item-text">
            <span>{t('desktop.receiptPrinter')}</span>
            <span className="cashier-desktop-menu__item-meta">
              {t('desktop.receiptPrinterHint', { name: printerLabel })}
            </span>
          </span>
        </button>
        <button
          type="button"
          className="cashier-desktop-menu__item"
          role="menuitem"
          onClick={runTestPrint}
        >
          <FileText size={15} strokeWidth={2} aria-hidden />
          <span>{t('desktop.testReceipt')}</span>
        </button>
        <div className="cashier-desktop-menu__sep" role="separator" />
        <button
          type="button"
          className="cashier-desktop-menu__item cashier-desktop-menu__item--stacked"
          role="menuitem"
          onClick={openLabelPicker}
        >
          <Tag size={15} strokeWidth={2} aria-hidden />
          <span className="cashier-desktop-menu__item-text">
            <span>{t('desktop.labelPrinter')}</span>
            <span className="cashier-desktop-menu__item-meta">
              {t('desktop.receiptPrinterHint', { name: labelPrinterLabel })}
            </span>
          </span>
        </button>
        <button
          type="button"
          className="cashier-desktop-menu__item"
          role="menuitem"
          onClick={openBarcodePage}
        >
          <Barcode size={15} strokeWidth={2} aria-hidden />
          <span>{t('desktop.barcodePrint')}</span>
        </button>
        <button
          type="button"
          className="cashier-desktop-menu__item cashier-desktop-menu__item--stacked"
          role="menuitem"
          onClick={openScalePicker}
        >
          <Scale size={15} strokeWidth={2} aria-hidden />
          <span className="cashier-desktop-menu__item-text">
            <span>{t('desktop.scale')}</span>
            <span className="cashier-desktop-menu__item-meta">
              {t('desktop.scaleHint', { port: scaleLabel })}
            </span>
          </span>
        </button>
        <div className="cashier-desktop-menu__sep" role="separator" />
        <button
          type="button"
          className="cashier-desktop-menu__item"
          role="menuitem"
          onClick={checkAppUpdates}
        >
          <Download size={15} strokeWidth={2} aria-hidden />
          <span>{t('desktop.checkUpdates')}</span>
        </button>
        <button
          type="button"
          className="cashier-desktop-menu__item"
          role="menuitem"
          disabled={reloadingUi}
          aria-busy={reloadingUi}
          onClick={reloadUi}
        >
          <RefreshCw
            size={15}
            strokeWidth={2}
            className={reloadingUi ? 'cashier-desktop-menu__spin' : undefined}
            aria-hidden
          />
          <span>
            {reloadingUi
              ? t('desktop.reloading', { defaultValue: 'Загрузка…' })
              : t('desktop.reload')}
          </span>
        </button>
        <button
          type="button"
          className="cashier-desktop-menu__item"
          role="menuitem"
          onClick={toggleFullscreen}
        >
          <Maximize size={15} strokeWidth={2} aria-hidden />
          <span>{t('desktop.fullscreen')}</span>
        </button>
        <div className="cashier-desktop-menu__sep" role="separator" />
        <button
          type="button"
          className="cashier-desktop-menu__item cashier-desktop-menu__item--danger"
          role="menuitem"
          onClick={() => run(() => window.desktopCashier.quit())}
        >
          <LogOut size={15} strokeWidth={2} aria-hidden />
          <span>{t('desktop.quit')}</span>
        </button>
      </div>
    </div>
  );
}
