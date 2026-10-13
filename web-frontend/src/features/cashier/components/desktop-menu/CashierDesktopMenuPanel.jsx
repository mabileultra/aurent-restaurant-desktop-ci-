import {
  Barcode,
  ChevronDown,
  Download,
  FileText,
  LogOut,
  Maximize,
  Printer,
  RefreshCw,
  Scale,
  Server,
  Tag,
} from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import BrandMark from '../../../../components/shared/BrandMark';
import { isDesktopCashier } from '../../../../utils/authLogin';
import { BRAND_LOGO_SIZES } from '../../../../config/brandLogos';
import CashierDesktopMenuConnectivity from './CashierDesktopMenuConnectivity';
import CashierDesktopMenuMultikassa from './CashierDesktopMenuMultikassa';
import CashierDesktopMenuFiscalDrive from './CashierDesktopMenuFiscalDrive';

export default function CashierDesktopMenuPanel({
  appName,
  menu,
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

  const label = appName || 'Aurent';
  const desktop = isDesktopCashier();
  const closeTimerRef = useRef(null);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose, setOpen]);

  const scheduleClose = useCallback(() => {
    if (reloadingUi) return;
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setOpen(false);
    }, 200);
  }, [cancelClose, reloadingUi, setOpen]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  return (
    <div
      ref={rootRef}
      className={`cashier-desktop-menu${open ? ' is-open' : ''}`}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="cashier-desktop-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          cancelClose();
          setOpen((v) => !v);
        }}
      >
        {desktop ? (
          <BrandMark
            variant="full"
            height={BRAND_LOGO_SIZES.pharmacyDesktop}
            className="cashier-desktop-menu__logo"
          />
        ) : (
          <>
            <BrandMark variant="full" height={BRAND_LOGO_SIZES.pharmacyDesktop} className="cashier-desktop-menu__logo" />
            <span className="cashier-desktop-menu__label">{label}</span>
          </>
        )}
        <ChevronDown size={12} strokeWidth={2.5} className="cashier-desktop-menu__chevron" aria-hidden />
      </button>
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

        <CashierDesktopMenuMultikassa t={t} />
        <CashierDesktopMenuFiscalDrive t={t} />

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
