import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { resolvePharmacyProductByMarking } from '../utils/resolvePharmacyProductByMarking';
import { isPharmacyMarkingCode, normalizePharmacyMarkingCode } from '../utils/pharmacyMarkingCode';
import { preserveMarkingCodeForFiscal } from '../utils/preserveMarkingCodeForFiscal';

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

    setVerifying(true);
    let product = null;
    let verifyResult = null;
    let verifyError = null;
    try {
      product = await resolvePharmacyProductByMarking({ products, rawCode, storeId });
      if (product) {
        onProductFound?.(withFiscalMark(product, rawCode));
        return true;
      }

      if (aslMarkingEnabled && storeId) {
        try {
          verifyResult = await pharmacyIntegrationApi
            .verifyMarking({ storeId, code: preserveMarkingCodeForFiscal(rawCode) })
            .then((r) => r.data);
        } catch (error) {
          verifyError = error.response?.data?.message ?? error.message;
        }
        if (verifyResult?.gtin) {
          product = await resolvePharmacyProductByMarking({
            products,
            rawCode,
            extraGtins: [verifyResult.gtin],
            storeId,
          });
        }
      }
    } catch (error) {
      verifyError = error.response?.data?.message ?? error.message;
    } finally {
      setVerifying(false);
    }

    setLastScan({
      code: preserveMarkingCodeForFiscal(rawCode),
      result: verifyResult,
      product,
    });

    if (product) {
      onProductFound?.(withFiscalMark(product, rawCode));
      return true;
    }

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
