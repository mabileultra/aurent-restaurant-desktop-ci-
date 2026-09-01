import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { findProductByMarkingCode } from '../utils/pharmacyMarkingProductMatch';
import { isPharmacyMarkingCode, normalizePharmacyMarkingCode } from '../utils/pharmacyMarkingCode';

export function usePharmacyMarkingScan({
  storeId,
  aslMarkingEnabled,
  products,
  onProductFound,
  onOpenMarkingModal,
}) {
  const { t } = useTranslation();
  const [lastScan, setLastScan] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const tryHandleMarkingScan = useCallback(async (rawCode, { silent = false } = {}) => {
    const code = normalizePharmacyMarkingCode(rawCode);
    if (!code || !isPharmacyMarkingCode(rawCode)) return false;

    const localProduct = findProductByMarkingCode(products, rawCode);
    if (localProduct) {
      onProductFound?.(localProduct);
      if (!silent) {
        toast.success(t('pharmacyCashier.integrations.markingProductFound', { name: localProduct.name }));
      }
    }

    if (!aslMarkingEnabled || !storeId) {
      onOpenMarkingModal?.(code);
      if (!silent && !localProduct) {
        toast(t('pharmacyCashier.integrations.markingScanHint'), { icon: 'ℹ️' });
      }
      return true;
    }

    setVerifying(true);
    try {
      const data = await pharmacyIntegrationApi
        .verifyMarking({ storeId, code })
        .then((r) => r.data);

      setLastScan({ code, result: data, product: localProduct });

      if (data.found) {
        const label = data.productName || data.gtin || code.slice(0, 18);
        toast.success(t('pharmacyCashier.integrations.markingVerified', { name: label }));
      } else if (!silent) {
        toast.error(t('pharmacyCashier.integrations.markingNotFound'));
      }

      if (!localProduct && data.gtin) {
        const byGtin = findProductByMarkingCode(products, `01${data.gtin}`);
        if (byGtin) {
          onProductFound?.(byGtin);
          toast.success(t('pharmacyCashier.integrations.markingProductFound', { name: byGtin.name }));
        }
      }

      onOpenMarkingModal?.(code, data);
      return true;
    } catch (error) {
      const message = error.response?.data?.message ?? error.message;
      if (!silent) toast.error(message);
      onOpenMarkingModal?.(code, { found: false, error: message });
      return true;
    } finally {
      setVerifying(false);
    }
  }, [aslMarkingEnabled, onOpenMarkingModal, onProductFound, products, storeId, t]);

  const clearLastScan = useCallback(() => setLastScan(null), []);

  return {
    lastScan,
    verifying,
    tryHandleMarkingScan,
    clearLastScan,
  };
}
