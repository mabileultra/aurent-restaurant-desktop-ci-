import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { tasnifApi } from '../../../api';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import {
  parsePreviewPrice,
  createDraftFromCatalogProduct,
  createDraftFromTasnif,
  executeBarcodeLookup,
  searchCatalogProducts,
} from '../utils/usersBarcodeDraftHelpers';

export function useUsersBarcodePrintPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ru') ? 'ru' : 'uz';
  const searchRef = useRef(null);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(null);
  const [priceInput, setPriceInput] = useState('0');
  const [catalogResults, setCatalogResults] = useState([]);
  const [tasnifResults, setTasnifResults] = useState([]);
  const [packageItem, setPackageItem] = useState(null);
  const [pendingQuery, setPendingQuery] = useState('');
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    if (draft) setPriceInput(String(draft.price ?? 0));
  }, [draft]);

  const clearSearchResults = useCallback(() => {
    setCatalogResults([]);
    setTasnifResults([]);
    setQuery('');
    setPackageItem(null);
    setPendingQuery('');
  }, []);

  const applyCatalogProduct = useCallback(
    async (data, searchQuerySaved = '') => {
      const draftObj = await createDraftFromCatalogProduct(data, searchQuerySaved);
      if (!draftObj) return false;
      setDraft(draftObj);
      toast.success(t('usersBarcodePrint.foundInCatalog'));
      clearSearchResults();
      return true;
    },
    [clearSearchResults, t]
  );

  const applyTasnifToDraft = useCallback(
    (item, pkg, searchQuerySaved) => {
      const draftObj = createDraftFromTasnif(item, pkg, searchQuerySaved, lang);
      if (!draftObj) {
        toast.error(t('productCatalog.mxikNotFound'));
        return;
      }
      setDraft(draftObj);
      toast.success(t('usersBarcodePrint.foundViaTasnif'));
      clearSearchResults();
    },
    [clearSearchResults, lang, t]
  );

  const pickTasnifItem = useCallback(
    async (item) => {
      const searchQuerySaved = query.trim() || pendingQuery.trim();
      let full = item;
      if (item.mxik) {
        try {
          const res = await tasnifApi.detail({ mxik: item.mxik, lang });
          full = res.data;
        } catch {}
      }
      const packages = full.packages ?? [];
      if (packages.length > 1) {
        setPendingQuery(searchQuerySaved);
        setPackageItem(full);
        return;
      }
      applyTasnifToDraft(full, packages[0] ?? null, searchQuerySaved);
    },
    [applyTasnifToDraft, lang, pendingQuery, query]
  );

  const searchCatalog = useCallback(
    (raw) => searchCatalogProducts({ raw, applyCatalogProduct, setCatalogResults, setTasnifResults, t }),
    [applyCatalogProduct, t]
  );

  const runLookup = useCallback(
    async (rawArg) => {
      const raw = (rawArg != null ? String(rawArg) : query).trim();
      if (raw.length < 2) {
        toast.error(t('productCatalog.mxikQueryTooShort'));
        return;
      }

      setLoading(true);
      setCatalogResults([]);
      setTasnifResults([]);
      try {
        await executeBarcodeLookup({
          raw,
          lang,
          applyCatalogProduct,
          searchCatalog,
          applyTasnifToDraft,
          pickTasnifItem,
          setPendingQuery,
          setPackageItem,
          setCatalogResults,
          setTasnifResults,
          t,
        });
      } catch (err) {
        toast.error(err.response?.data?.message ?? t('productCatalog.mxikLookupFailed'));
      } finally {
        setLoading(false);
      }
    },
    [applyCatalogProduct, applyTasnifToDraft, lang, pickTasnifItem, query, searchCatalog, t]
  );

  useBarcodeScanner({
    enabled: true,
    barcodeInputRef: searchRef,
    onScan: (code) => {
      setQuery(code);
      runLookup(code);
    },
  });

  const previewPrice = parsePreviewPrice(priceInput);

  const handlePackageSelect = useCallback(
    (pkg) => {
      if (packageItem) applyTasnifToDraft(packageItem, pkg, pendingQuery);
    },
    [applyTasnifToDraft, packageItem, pendingQuery]
  );

  const handleCatalogPick = useCallback(
    (product) => {
      void applyCatalogProduct(product, query.trim() || pendingQuery.trim());
    },
    [applyCatalogProduct, pendingQuery, query]
  );

  const handleOpenPrint = useCallback(() => {
    if (!draft?.barcode?.trim()) {
      toast.error(t('usersBarcodePrint.noBarcodeForPrint'));
      return;
    }
    setPrintOpen(true);
  }, [draft, t]);

  return {
    t,
    lang,
    searchRef,
    query,
    setQuery,
    loading,
    draft,
    priceInput,
    setPriceInput,
    catalogResults,
    tasnifResults,
    packageItem,
    pendingQuery,
    printOpen,
    previewPrice,
    runLookup,
    pickTasnifItem,
    handleCatalogPick,
    handlePackageSelect,
    handlePackageClose: () => setPackageItem(null),
    handleOpenPrint,
    handleClosePrint: () => setPrintOpen(false),
  };
}
