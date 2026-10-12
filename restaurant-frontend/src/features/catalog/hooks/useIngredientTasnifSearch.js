import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { tasnifApi } from '../../../api';
import { isRealFiscalPackageCode } from '../../../services/fiscal/shared/resolveFiscalPackageCodes';
import {
  buildTasnifExternalId,
  buildTasnifSku,
  isAutoTasnifExternalId,
  isAutoTasnifSku,
  resolveCatalogBarcodeFromTasnif,
} from '../../../utils/tasnifProductIds';

/**
 * Tasnif search for IngredientModal (plain form state, not react-hook-form).
 * @param {{ form: object, patchForm: (patch: object) => void, isEdit: boolean, fillName?: 'always' | 'ifEmpty' }} args
 */
export function useIngredientTasnifSearch({ form, patchForm, isEdit, fillName = 'always' }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ru') ? 'ru' : 'uz';

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [packageItem, setPackageItem] = useState(null);
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');

  const applyToForm = (item, pkg, searchQuery = '') => {
    if (!item?.name) return;
    const patch = {
      ikpu: item.mxik ? String(item.mxik) : form.ikpu,
      markedProduct: !!item.markedProduct,
    };
    if (fillName === 'always' || (fillName === 'ifEmpty' && !String(form.name || '').trim())) {
      patch.name = item.name;
    }

    const barcode = resolveCatalogBarcodeFromTasnif(item, searchQuery, pkg);
    if (barcode) patch.barcode = barcode;

    if (pkg) {
      const unit =
        lang === 'ru'
          ? pkg.nameRu || pkg.nameUz || pkg.nameLat
          : pkg.nameUz || pkg.nameRu || pkg.nameLat;
      if (unit) patch.unitOfMeasure = unit;
      if (pkg.packageType) patch.unitMeasureCode = String(pkg.packageType);
      if (pkg.code) patch.packageCode = String(pkg.code).trim();
    }

    if (!isEdit && item.mxik) {
      const packageCode = pkg?.code != null ? String(pkg.code).trim() : (patch.packageCode || form.packageCode || '');
      const nextSku = buildTasnifSku(item.mxik, packageCode);
      if (!form.sku?.trim() || isAutoTasnifSku(form.sku)) {
        patch.sku = nextSku;
      }
      const nextExtId = buildTasnifExternalId(item.mxik, packageCode);
      if (isAutoTasnifExternalId(form.externalProductId, item.mxik)) {
        patch.externalProductId = nextExtId;
      }
    }

    patchForm(patch);
    toast.success(t('productCatalog.mxikApplied'));
    setResults([]);
    setQuery('');
  };

  const pickItem = async (item) => {
    const searchQuery = query.trim();
    let full = item;
    if (item.mxik) {
      try {
        const res = await tasnifApi.detail({ mxik: item.mxik, lang });
        full = res.data;
      } catch {
        /* use search row */
      }
    }
    const packages = (full.packages ?? []).filter((pkg) => isRealFiscalPackageCode(pkg?.code));
    if (packages.length > 1) {
      setPendingSearchQuery(searchQuery);
      setPackageItem({ ...full, packages });
      return;
    }
    applyToForm(full, packages[0] ?? null, searchQuery);
  };

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2) {
      toast.error(t('productCatalog.mxikQueryTooShort'));
      return;
    }
    setLoading(true);
    setResults([]);
    setError(null);
    try {
      const res = await tasnifApi.search({ q, lang, page: 0, size: 25 });
      const items = res.data?.items ?? [];
      if (!items.length) {
        setError(t('productCatalog.mxikNotFound'));
      }
      setResults(items);
    } catch {
      setError(t('rst.nomenclature.tasnifUnavailable'));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    t,
    lang,
    query,
    setQuery,
    loading,
    results,
    error,
    packageItem,
    runSearch,
    pickItem,
    handlePackageSelect: (pkg) => {
      applyToForm(packageItem, pkg, pendingSearchQuery);
      setPackageItem(null);
      setPendingSearchQuery('');
    },
    handlePackageClose: () => setPackageItem(null),
  };
}
