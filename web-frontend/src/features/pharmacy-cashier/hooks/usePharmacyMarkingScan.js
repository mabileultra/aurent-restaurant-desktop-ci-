import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useCartStore } from '../../../store/cartStore';
import {
  assessMarkLifecycle,
  isMarkingCode,
  markingIdentityKeys,
  normalizeMarkingCode,
  preserveMarkingCodeForFiscal,
} from '../../marking';
import { resolveCashierMarkedProduct } from '../utils/resolveCashierMarkedProduct';
import { resolveCashierMarkingMissMessage } from '../utils/resolveMarkingVerifyUserMessage';

/**
 * Скан / вставка КМ из поля поиска — та же логика, что модалка ASL.
 */
export function usePharmacyMarkingScan({
  storeId,
  cashRegisterId = null,
  aslMarkingEnabled,
  products,
  onProductFound,
}) {
  const { t } = useTranslation();
  const [lastScan, setLastScan] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const pendingRef = useRef(new Set());
  const queueRef = useRef([]);
  const runningRef = useRef(false);

  const processOne = useCallback(async (rawCode, { silent = false } = {}) => {
    const code = normalizeMarkingCode(rawCode);
    if (!code || !isMarkingCode(rawCode)) return;

    const mark = preserveMarkingCodeForFiscal(rawCode);
    const keys = markingIdentityKeys(mark);
    const cartItems = useCartStore.getState().items;

    const before = assessMarkLifecycle({
      rawCode: mark,
      cartItems,
      pendingKeys: [...pendingRef.current],
      storeId,
    });

    if (before.status === 'duplicate') {
      if (!silent) toast.error(t('pharmacyCashier.integrations.markingAlreadyCounted'));
      return;
    }
    if (before.status === 'sold') {
      if (!silent) toast.error(t('pharmacyCashier.integrations.markingAlreadySold'));
      return;
    }

    keys.forEach((k) => pendingRef.current.add(k));
    setVerifying(true);

    try {
      const resolved = await resolveCashierMarkedProduct({
        products,
        rawCode: mark,
        storeId,
        cashRegisterId,
        aslEnabled: Boolean(aslMarkingEnabled),
      });

      const afterDup = assessMarkLifecycle({
        rawCode: mark,
        cartItems: useCartStore.getState().items,
        pendingKeys: [...pendingRef.current].filter((k) => !keys.includes(k)),
        aslResult: resolved.aslResult,
        storeId,
      });

      if (afterDup.status === 'duplicate') {
        if (!silent) toast.error(t('pharmacyCashier.integrations.markingAlreadyCounted'));
        return;
      }

      if (resolved.status === 'sold' || afterDup.status === 'sold') {
        if (!silent) {
          toast.error(t(aslMarkingEnabled
            ? 'pharmacyCashier.integrations.markingAlreadySold'
            : 'pharmacyCashier.integrations.markingSoldLocalNoKey'));
        }
        setLastScan({ code: mark, result: resolved.aslResult, product: resolved.product });
        return;
      }
      if (resolved.status === 'withdrawn') {
        if (!silent) toast.error(resolved.message || t('pos.markingNotInCirculation'));
        setLastScan({ code: mark, result: resolved.aslResult, product: null });
        return;
      }
      if (resolved.status === 'check-failed') {
        if (!silent) toast.error(resolved.message || t('pos.markingCheckFailed'));
        setLastScan({ code: mark, result: resolved.aslResult, product: null });
        return;
      }

      if (resolved.status === 'ok' && resolved.product) {
        const result = onProductFound?.(resolved.product);
        setLastScan({ code: mark, result: resolved.aslResult, product: resolved.product });
        if (result?.status === 'duplicate' && !silent) {
          toast.error(t('pharmacyCashier.integrations.markingAlreadyCounted'));
        }
        return;
      }

      setLastScan({ code: mark, result: resolved.aslResult, product: null });
      if (!silent) {
        toast.error(
          aslMarkingEnabled
            ? resolveCashierMarkingMissMessage({
              aslEnabled: true,
              aslResult: resolved.aslResult,
              aslError: resolved.aslError,
              t,
            })
            : t('pharmacyCashier.integrations.markingCatalogNeed'),
        );
      }
    } finally {
      keys.forEach((k) => pendingRef.current.delete(k));
      setVerifying(false);
    }
  }, [aslMarkingEnabled, cashRegisterId, onProductFound, products, storeId, t]);

  const drain = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      while (queueRef.current.length > 0) {
        const job = queueRef.current.shift();
        await processOne(job.rawCode, job.opts);
      }
    } finally {
      runningRef.current = false;
    }
  }, [processOne]);

  const tryHandleMarkingScan = useCallback((rawCode, opts = {}) => {
    const code = normalizeMarkingCode(rawCode);
    if (!code || !isMarkingCode(rawCode)) return false;
    queueRef.current.push({ rawCode, opts });
    void drain();
    return true;
  }, [drain]);

  const clearLastScan = useCallback(() => setLastScan(null), []);

  return {
    lastScan,
    verifying,
    tryHandleMarkingScan,
    clearLastScan,
  };
}
