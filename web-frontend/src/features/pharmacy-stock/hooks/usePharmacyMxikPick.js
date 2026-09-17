import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { tasnifApi } from '../../../api';
import { applyMxikFlags } from '../utils/inferPharmacyMxikFlags';
import {
  realTasnifPackages,
  tasnifPackageLabel,
} from '../utils/pharmacyPackageSelection';

export function usePharmacyMxikPick(setForm) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('uz') ? 'uz' : 'ru';
  const [mxikQuery, setMxikQuery] = useState('');
  const [mxikResults, setMxikResults] = useState([]);
  const [mxikLoading, setMxikLoading] = useState(false);
  const [packageItem, setPackageItem] = useState(null);

  const applyItem = (item, pkg) => {
    const mxik = item?.mxik || item?.code || item?.ikpu || '';
    const name = item?.name || item?.title || '';
    const barcode = item?.barcode || item?.internalCode || '';
    setForm((prev) => {
      const next = {
        ...prev,
        ikpu: mxik,
        ikpuStatus: 'FOUND',
        name: prev.name.trim() ? prev.name : (name || prev.name),
        barcode: prev.barcode.trim()
          ? prev.barcode
          : (barcode && String(barcode).length >= 8 ? String(barcode) : prev.barcode),
        manufacturer: prev.manufacturer.trim()
          ? prev.manufacturer
          : (item?.manufacturer || item?.brand || prev.manufacturer),
        dosageForm: prev.dosageForm.trim()
          ? prev.dosageForm
          : (item?.packageName || item?.unitName || prev.dosageForm),
        packageCode: pkg?.code ? String(pkg.code).trim() : '',
        packageName: pkg ? tasnifPackageLabel(pkg, lang) : '',
      };
      return applyMxikFlags(next, item);
    });
    setMxikResults([]);
    setMxikQuery(mxik);
  };

  const loadDetail = async (item) => {
    const mxik = item?.mxik || item?.code || item?.ikpu || '';
    if (!mxik) return item;
    try {
      const res = await tasnifApi.detail({ mxik, lang });
      return res.data ?? item;
    } catch {
      return item;
    }
  };

  const pickMxik = async (item) => {
    const full = await loadDetail(item);
    const packages = realTasnifPackages(full);
    if (packages.length > 1) {
      applyItem(full, null);
      setPackageItem({ ...full, packages });
      return;
    }
    applyItem(full, packages[0] ?? null);
    toast.success(t('pharmacyStock.mxikApplied'));
  };

  const searchMxik = async (fallbackIkpu) => {
    const q = (mxikQuery || fallbackIkpu || '').trim();
    if (q.length < 2) {
      toast.error(t('pharmacyStock.mxikQueryShort'));
      return;
    }
    setMxikLoading(true);
    try {
      const res = await tasnifApi.search({ q, lang, page: 0, size: 15 });
      const list = res.data?.items ?? res.data?.content ?? [];
      setMxikResults(Array.isArray(list) ? list : []);
      if (!list?.length) {
        toast.error(t('pharmacyStock.mxikSearchFailed'));
        return;
      }
      const qNorm = q.replace(/\s/g, '');
      const exact = list.find((row) => {
        const code = String(row?.mxik || row?.code || row?.ikpu || '').replace(/\s/g, '');
        return code && code === qNorm;
      });
      if (exact || list.length === 1) {
        await pickMxik(exact || list[0]);
      }
    } catch {
      setMxikResults([]);
      toast.error(t('pharmacyStock.mxikSearchFailed'));
    } finally {
      setMxikLoading(false);
    }
  };

  const choosePackage = async (ikpu) => {
    const code = String(ikpu || mxikQuery || '').trim();
    if (code.length < 3) {
      toast.error(t('pharmacyStock.mxikQueryShort'));
      return;
    }
    const full = await loadDetail({ mxik: code, name: code });
    const packages = realTasnifPackages(full);
    if (!packages.length) return null;
    if (packages.length === 1) {
      const picked = {
        code: String(packages[0].code).trim(),
        name: tasnifPackageLabel(packages[0], lang),
      };
      setForm((prev) => ({
        ...prev,
        packageCode: picked.code,
        packageName: picked.name,
      }));
      return picked;
    }
    setPackageItem({ ...full, packages, name: full?.name || code });
    return null;
  };

  const handlePackageSelect = (pkg) => {
    setForm((prev) => ({
      ...prev,
      packageCode: String(pkg.code).trim(),
      packageName: tasnifPackageLabel(pkg, lang),
    }));
    setPackageItem(null);
    toast.success(t('pharmacyStock.mxikApplied'));
  };

  const resetMxik = (ikpu = '') => {
    setMxikResults([]);
    setPackageItem(null);
    setMxikQuery(ikpu || '');
  };

  return {
    lang,
    mxikQuery,
    setMxikQuery,
    mxikResults,
    mxikLoading,
    packageItem,
    searchMxik,
    pickMxik,
    choosePackage,
    handlePackageSelect,
    closePackagePicker: () => setPackageItem(null),
    resetMxik,
  };
}
