import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useCashierDesktopMenu } from '../../cashier/hooks/useCashierDesktopMenu';
import { isDesktopCashier } from '../../cashier/utils/isDesktopCashier';

function stayOnCashier(t) {
  toast(t('desktop.stayOnCashier', {
    defaultValue: 'Это действие только в десктоп-кассе Aurent, здесь не уходим с экрана.',
  }));
}

/** Меню настроек кассы: как в продукте, без ухода со страницы кассы. */
export function usePharmacyPosSettingsMenu() {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const desktopMenu = useCashierDesktopMenu();
  const desktop = isDesktopCashier();

  return useMemo(() => {
    const base = desktopMenu ?? {
      t,
      rootRef,
      open: true,
      setOpen: () => {},
      close: () => {},
      run: async () => {},
      toggleFullscreen: () => stayOnCashier(t),
      reloadUi: () => stayOnCashier(t),
      reloadingUi: false,
      printerName: '',
      labelPrinterName: '',
      scalePort: '',
      openPrinterPicker: () => stayOnCashier(t),
      openLabelPicker: () => stayOnCashier(t),
      runTestPrint: () => stayOnCashier(t),
      openScalePicker: () => stayOnCashier(t),
      openBarcodePage: () => stayOnCashier(t),
      checkAppUpdates: () => stayOnCashier(t),
      openServerSetup: () => stayOnCashier(t),
      printerLabel: t('desktop.receiptPrinterNotSet'),
      labelPrinterLabel: t('desktop.receiptPrinterNotSet'),
      scaleLabel: t('desktop.scaleNotSet'),
    };

    return {
      ...base,
      rootRef: base.rootRef ?? rootRef,
      open: true,
      setOpen: () => {},
      // С кассы не уходим на setup / штрихкоды / выход приложения.
      openServerSetup: () => stayOnCashier(t),
      openBarcodePage: () => stayOnCashier(t),
      reloadUi: desktop ? base.reloadUi : () => stayOnCashier(t),
      run: async () => stayOnCashier(t),
    };
  }, [desktopMenu, desktop, t]);
}
