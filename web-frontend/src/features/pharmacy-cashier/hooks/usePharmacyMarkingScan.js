import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { useCartStore } from '../../../store/cartStore';
import { resolvePharmacyProductByMarking } from '../utils/resolvePharmacyProductByMarking';
import { isPharmacyMarkingCode, normalizePharmacyMarkingCode } from '../utils/pharmacyMarkingCode';
import { preserveMarkingCodeForFiscal } from '../utils/preserveMarkingCodeForFiscal';
import { assessPharmacyMarkLifecycle } from '../utils/pharmacyMarkLifecycle';
import { markingIdentityKey } from '../utils/pharmacyMarkIdentity';

function withFiscalMark(product, rawCode) {
  if (!product) return product;
  const mark = preserveMarkingCodeForFiscal(rawCode);
  return {
    ...product,
    productMark: mark,
    markCode: mark,
    markedProduct: true,
  };
}

/**
 * Скан КМ из единого поля поиска.
 * Порядок: duplicate в чеке → ASL sold → найти товар → в чек.
 */
export function usePharmacyMarkingScan({
  storeId,
  aslMarkingEnabled,
  products,
  onProductFound,
}) {
  const { t } = useTranslation();
  const [lastScan, setLastScan] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const pendingRef = useRef(new Set());

  const tryHandleMarkingScan = useCallback(async (rawCode, { silent = false } = {}) => {
    const code = normalizePharmacyMarkingCode(rawCode);
    if (!code || !isPharmacyMarkingCode(rawCode)) return false;

    const mark = preserveMarkingCodeForFiscal(rawCode);
    const key = markingIdentityKey(mark);
    const cartItems = useCartStore.getState().items;

    const before = assessPharmacyMarkLifecycle({
      rawCode: mark,
      cartItems,
      pendingKeys: [...pendingRef.current],
    });

    if (before.status === 'duplicate') {
      if (!silent) {
        toast.error(t('pharmacyCashier.integrations.markingAlreadyCounted'));
      }
      return true;
    }

    if (key) pendingRef.current.add(key);
    setVerifying(true);

    let product = null;
    let verifyResult = null;
    let verifyError = null;

    try {
      const aslPromise = aslMarkingEnabled && storeId
        ? pharmacyIntegrationApi.verifyMarking({ storeId, code: mark }).then((r) => r.data)
        : null;

      try {
        product = await resolvePharmacyProductByMarking({ products, rawCode, storeId });
      } catch (error) {
        verifyError = error.response?.data?.message ?? error.message;
      }

      if (aslPromise) {
        try {
          verifyResult = await aslPromise;
        } catch (error) {
          verifyError = verifyError || (error.response?.data?.message ?? error.message);
        }
      }

      const afterAsl = assessPharmacyMarkLifecycle({
        rawCode: mark,
        cartItems: useCartStore.getState().items,
        pendingKeys: [...pendingRef.current].filter((k) => k !== key),
        aslResult: verifyResult,
      });

      if (afterAsl.status === 'duplicate') {
        if (!silent) toast.error(t('pharmacyCashier.integrations.markingAlreadyCounted'));
        return true;
      }
      if (afterAsl.status === 'sold') {
        if (!silent) toast.error(t('pharmacyCashier.integrations.markingAlreadySold'));
        setLastScan({ code: mark, result: verifyResult, product });
        return true;
      }

      if (!product && verifyResult?.gtin) {
        try {
          product = await resolvePharmacyProductByMarking({
            products,
            rawCode,
            extraGtins: [verifyResult.gtin],
            storeId,
          });
        } catch (error) {
          verifyError = verifyError || (error.response?.data?.message ?? error.message);
        }
      }

      if (product) {
        const result = onProductFound?.(withFiscalMark(product, rawCode));
        setLastScan({ code: mark, result: verifyResult, product });
        if (result?.status === 'duplicate' && !silent) {
          toast.error(t('pharmacyCashier.integrations.markingAlreadyCounted'));
        }
        return true;
      }

      setLastScan({ code: mark, result: verifyResult, product: null });
      if (!silent) {
        if (verifyResult?.found && verifyResult.productName) {
          toast.error(t('pharmacyCashier.integrations.markingCatalogMiss', {
            name: verifyResult.productName,
          }));
        } else if (verifyError) {
          toast.error(verifyError);
        } else if (!aslMarkingEnabled) {
          toast(t('pharmacyCashier.integrations.markingScanHint'), { icon: 'ℹ️' });
        } else {
          toast.error(t('pharmacyCashier.integrations.markingNotFound'));
        }
      }
      return true;
    } finally {
      if (key) pendingRef.current.delete(key);
      setVerifying(false);
    }
  }, [aslMarkingEnabled, onProductFound, products, storeId, t]);

  const clearLastScan = useCallback(() => setLastScan(null), []);

  return {
    lastScan,
    verifying,
    tryHandleMarkingScan,
    clearLastScan,
  };
}
