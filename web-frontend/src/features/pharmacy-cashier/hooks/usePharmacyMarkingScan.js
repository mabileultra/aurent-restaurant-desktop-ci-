import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { resolvePharmacyProductByMarking } from '../utils/resolvePharmacyProductByMarking';
import { isPharmacyMarkingCode, normalizePharmacyMarkingCode } from '../utils/pharmacyMarkingCode';
import { preserveMarkingCodeForFiscal } from '../utils/preserveMarkingCodeForFiscal';
import { isAslMarkAlreadySold } from '../utils/aslMarkingAlreadySold';
import { removePharmacyMarking } from '../utils/pharmacyMarkedScanCart';

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

export function usePharmacyMarkingScan({
  storeId,
  aslMarkingEnabled,
  products,
  onProductFound,
}) {
  const { t } = useTranslation();
  const [lastScan, setLastScan] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const tryHandleMarkingScan = useCallback(async (rawCode, { silent = false } = {}) => {
    const code = normalizePharmacyMarkingCode(rawCode);
    if (!code || !isPharmacyMarkingCode(rawCode)) return false;

    const mark = preserveMarkingCodeForFiscal(rawCode);
    const aslCheck = aslMarkingEnabled && storeId
      ? pharmacyIntegrationApi.verifyMarking({ storeId, code: mark }).then((r) => r.data)
      : null;
    setVerifying(true);
    let product = null;
    let verifyResult = null;
    let verifyError = null;
    try {
      product = await resolvePharmacyProductByMarking({ products, rawCode, storeId });
    } catch (error) {
      verifyError = error.response?.data?.message ?? error.message;
    } finally {
      setVerifying(false);
    }

    if (product) {
      onProductFound?.(withFiscalMark(product, rawCode));
      aslCheck
        ?.then((result) => {
          setLastScan({ code: mark, result, product });
          if (isAslMarkAlreadySold(result)) {
            removePharmacyMarking(rawCode);
            if (!silent) toast.error(t('pharmacyCashier.integrations.markingAlreadySold'));
          }
        })
        .catch(() => {});
      return true;
    }

    if (aslCheck) {
      try {
        verifyResult = await aslCheck;
      } catch (error) {
        verifyError = error.response?.data?.message ?? error.message;
      }
      if (isAslMarkAlreadySold(verifyResult)) {
        if (!silent) toast.error(t('pharmacyCashier.integrations.markingAlreadySold'));
        return true;
      }
      if (verifyResult?.gtin) {
        try {
          product = await resolvePharmacyProductByMarking({
            products,
            rawCode,
            extraGtins: [verifyResult.gtin],
            storeId,
          });
        } catch (error) {
          verifyError = error.response?.data?.message ?? error.message;
        }
        if (product) {
          onProductFound?.(withFiscalMark(product, rawCode));
          return true;
        }
      }
    }

    setLastScan({ code: mark, result: verifyResult, product });

    if (!silent) {
      if (verifyResult?.found && verifyResult.productName) {
        toast.error(t('pharmacyCashier.integrations.markingCatalogMiss', { name: verifyResult.productName }));
      } else if (verifyError) {
        toast.error(verifyError);
      } else if (!aslMarkingEnabled) {
        toast(t('pharmacyCashier.integrations.markingScanHint'), { icon: 'ℹ️' });
      } else {
        toast.error(t('pharmacyCashier.integrations.markingNotFound'));
      }
    }
    return true;
  }, [aslMarkingEnabled, onProductFound, products, storeId, t]);

  const clearLastScan = useCallback(() => setLastScan(null), []);

  return {
    lastScan,
    verifying,
    tryHandleMarkingScan,
    clearLastScan,
  };
}
