import { Suspense, useState } from 'react';
import { lazyPage as lazy } from '../../../../router/lazyWithRetry';
import { QrCode, Settings2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { multikassaApi } from '../../../../api/multikassa.api';
import {
  describeMultikassaStatus,
  useMultikassaCashierStatus,
} from '../../hooks/useMultikassaCashierStatus';
import { useCashierStore } from '../../../../hooks/useCashierStore';
import { useCashierShift } from '../../../../hooks/useCashierShift';
import { getApiErrorMessage } from '../../../../utils/apiError';

const MultikassaSettingsModal = lazy(() =>
  import('../../../cash-registers/components/MultikassaSettingsModal'),
);

const GENERIC_SERVER_ERROR = 'An unexpected error occurred';

/**
 * Тумблер фискального QR в меню Aurent Desktop + вход в настройки Multikassa.
 */
export default function CashierDesktopMenuMultikassa({ t }) {
  const { storeId } = useCashierStore();
  const { data: shift } = useCashierShift(storeId);
  const cashRegisterId = shift?.cashRegisterId ?? null;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const qc = useQueryClient();
  const { data: caps, isLoading } = useMultikassaCashierStatus({
    storeId,
    cashRegisterId,
    enabled: storeId != null,
  });
  const status = describeMultikassaStatus(caps, t);
  const printQr = caps?.printFiscalQr !== false;
  const enabled = Boolean(caps?.enabled);

  const mutation = useMutation({
    mutationFn: (nextPrintQr) =>
      multikassaApi
        .updateCashierFlags(storeId, cashRegisterId, { printFiscalQr: nextPrintQr })
        .then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(['multikassa-cashier-caps', storeId, cashRegisterId], data);
      qc.invalidateQueries({ queryKey: ['multikassa-cashier-caps', storeId, cashRegisterId] });
      toast.success(
        data?.printFiscalQr === false
          ? t('desktop.multikassaQrOffToast')
          : t('desktop.multikassaQrOnToast'),
        { id: 'multikassa-qr-toggle' },
      );
    },
    onError: (e) => {
      const apiMsg = getApiErrorMessage(e, '');
      const msg =
        apiMsg === GENERIC_SERVER_ERROR || e?.response?.data?.code === 'INTERNAL_ERROR'
          ? t('desktop.multikassaQrSaveFailed')
          : apiMsg || t('desktop.multikassaQrSaveFailed');
      toast.error(msg, { id: 'multikassa-qr-toggle' });
    },
  });

  const openSettings = () => {
    if (!cashRegisterId) {
      toast.error(t('cashRegisters.multikassa.needOpenShift'), { id: 'multikassa-settings' });
      return;
    }
    setSettingsOpen(true);
  };

  if (storeId == null) return null;

  return (
    <>
      <div className="cashier-desktop-menu__connectivity">
        <div className="cashier-desktop-menu__section-label">{t('desktop.multikassaSection')}</div>
        <p className={`cashier-desktop-menu__mk-status cashier-desktop-menu__mk-status--${status.tone}`}>
          {isLoading ? t('cashRegisters.multikassa.statusUnknown') : status.label}
        </p>
        <button
          type="button"
          className="cashier-desktop-menu__item"
          role="menuitem"
          onClick={(e) => {
            e.stopPropagation();
            openSettings();
          }}
        >
          <Settings2 size={15} strokeWidth={2} aria-hidden />
          <span>{t('cashRegisters.multikassa.openSettings')}</span>
        </button>
        <button
          type="button"
          className={[
            'cashier-desktop-menu__mode',
            'is-toggle',
            enabled && printQr ? 'is-online has-bridge' : 'is-offline',
          ]
            .filter(Boolean)
            .join(' ')}
          role="menuitemcheckbox"
          aria-checked={enabled && printQr}
          disabled={mutation.isPending || isLoading}
          onClick={() => {
            if (!enabled) {
              toast.error(t('cashRegisters.multikassa.enableFirstForQr'), {
                id: 'multikassa-qr-toggle',
              });
              openSettings();
              return;
            }
            mutation.mutate(!printQr);
          }}
        >
          <span className="cashier-desktop-menu__mode-icon" aria-hidden>
            <QrCode size={14} strokeWidth={2} />
          </span>
          <span className="cashier-desktop-menu__item-text">
            <span>{t('desktop.multikassaPrintQr')}</span>
            <span className="cashier-desktop-menu__item-meta">
              {!enabled
                ? t('cashRegisters.multikassa.enableFirstForQr')
                : printQr
                  ? t('desktop.multikassaPrintQrOn')
                  : t('desktop.multikassaPrintQrOff')}
            </span>
          </span>
          <span className="cashier-desktop-menu__mode-switch" aria-hidden>
            <span className="cashier-desktop-menu__mode-knob" />
          </span>
        </button>
      </div>

      {settingsOpen && cashRegisterId ? (
        <Suspense fallback={null}>
          <MultikassaSettingsModal
            open={settingsOpen}
            cashRegisterId={cashRegisterId}
            onClose={() => {
              setSettingsOpen(false);
              qc.invalidateQueries({ queryKey: ['multikassa-cashier-caps', storeId, cashRegisterId] });
            }}
          />
        </Suspense>
      ) : null}
    </>
  );
}
