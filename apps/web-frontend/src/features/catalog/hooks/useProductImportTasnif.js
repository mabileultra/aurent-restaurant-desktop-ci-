import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { isRowNew } from '../../../utils/productImportUtils';
import { verifyProductImportRowsTasnif } from '../utils/verifyProductImportTasnif';

export function useProductImportTasnif({ i18n, t, setEditable, setPage }) {
  const [tasnifByRow, setTasnifByRow] = useState({});
  const [tasnifFilter, setTasnifFilter] = useState('all');
  const [verifyingTasnif, setVerifyingTasnif] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState({ done: 0, total: 0 });
  const verifyGenRef = useRef(0);

  const applyTasnifToEditable = useCallback((byRow) => {
    setEditable((prev) => {
      const next = { ...prev };
      Object.entries(byRow || {}).forEach(([rowNumKey, result]) => {
        const rowNum = Number(rowNumKey);
        if (!next[rowNum] || result?.status !== 'found') return;
        const fromTasnif = String(result.barcode || '').trim();
        const existing = String(next[rowNum].barcode || '').trim();
        next[rowNum] = {
          ...next[rowNum],
          ikpu: result.ikpu || next[rowNum].ikpu || '',
          barcode: fromTasnif || existing,
          packageCode: result.packageCode || next[rowNum].packageCode || '',
          markedProduct:
            result.markedProduct != null
              ? Boolean(result.markedProduct)
              : (next[rowNum].markedProduct ?? false),
          ikpuStatus: 'FOUND',
        };
      });
      return next;
    });
  }, [setEditable]);

  const runTasnifVerify = useCallback(
    async (rows) => {
      const list = rows ?? [];
      if (!list.length) {
        setTasnifByRow({});
        return;
      }
      const gen = ++verifyGenRef.current;
      setVerifyingTasnif(true);
      setVerifyProgress({ done: 0, total: list.filter((r) => isRowNew(r)).length });
      try {
        const lang = (i18n.language || 'ru').slice(0, 2);
        const byRow = await verifyProductImportRowsTasnif(list, {
          lang,
          onProgress: (map, done, total) => {
            if (gen !== verifyGenRef.current) return;
            setTasnifByRow(map);
            if (done != null) setVerifyProgress({ done, total });
          },
        });
        if (gen !== verifyGenRef.current) return;
        setTasnifByRow(byRow);
        applyTasnifToEditable(byRow);
      } catch {
        if (gen === verifyGenRef.current) {
          toast.error(t('products.import.tasnif.verifyFailed'));
        }
      } finally {
        if (gen === verifyGenRef.current) setVerifyingTasnif(false);
      }
    },
    [applyTasnifToEditable, i18n.language, t]
  );

  const setTasnifFilterAndResetPage = (next) => {
    setTasnifFilter(next);
    setPage(1);
  };

  return {
    tasnifByRow,
    setTasnifByRow,
    tasnifFilter,
    setTasnifFilter: setTasnifFilterAndResetPage,
    verifyingTasnif,
    verifyProgress,
    runTasnifVerify,
  };
}
