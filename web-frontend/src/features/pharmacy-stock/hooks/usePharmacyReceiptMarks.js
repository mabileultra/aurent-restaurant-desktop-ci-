import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { pharmacyIntegrationApi } from '../../../api';
import {
  isCompletePharmacyMarkingScan,
  isPharmacyMarkingCode,
  normalizePharmacyMarkingCode,
} from '../../pharmacy-cashier/utils/pharmacyMarkingCode';
import { marksForLine, requiredMarkCountForLine } from '../utils/pharmacyReceiptMarks';

/**
 * Буфер КМ по строкам прихода: verify в ASL → локальный список до activate.
 */
export function usePharmacyReceiptMarks({ storeId, t, aslEnabled = true }) {
  const [marksByLineId, setMarksByLineId] = useState({});
  const [busyLineId, setBusyLineId] = useState(null);

  const hydrateMarks = useCallback((byLineId) => {
    if (!byLineId || typeof byLineId !== 'object') return;
    setMarksByLineId((prev) => {
      const next = { ...prev };
      Object.entries(byLineId).forEach(([lineId, list]) => {
        if (!Array.isArray(list) || !list.length) return;
        const existing = marksForLine(next, lineId);
        const seen = new Set(existing.map((m) => m.code.toLowerCase()));
        const merged = [...existing];
        list.forEach((entry) => {
          const code = String(entry?.code || '').trim();
          if (!code || seen.has(code.toLowerCase())) return;
          seen.add(code.toLowerCase());
          merged.push({ code, aslStatus: entry.aslStatus || null });
        });
        next[lineId] = merged;
      });
      return next;
    });
  }, []);

  const clearLine = useCallback((lineId) => {
    setMarksByLineId((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
  }, []);

  const removeMark = useCallback((lineId, code) => {
    setMarksByLineId((prev) => {
      const list = marksForLine(prev, lineId).filter((m) => m.code !== code);
      return { ...prev, [lineId]: list };
    });
  }, []);

  const addMarkToLine = useCallback(async (line, rawCode) => {
    if (!line?.id || !line?.productId) return false;
    const code = normalizePharmacyMarkingCode(rawCode);
    if (!isPharmacyMarkingCode(rawCode) && !isCompletePharmacyMarkingScan(rawCode)) {
      toast.error(t('pharmacyStock.marks.invalidCode'));
      return false;
    }
    const existing = marksForLine(marksByLineId, line.id);
    if (existing.some((m) => m.code.toLowerCase() === code.toLowerCase())) {
      toast.error(t('pharmacyStock.marks.duplicate'));
      return false;
    }
    const need = requiredMarkCountForLine(line);
    if (need > 0 && existing.length >= need) {
      toast.error(t('pharmacyStock.marks.enough'));
      return false;
    }

    setBusyLineId(line.id);
    try {
      let aslStatus = null;
      if (aslEnabled && storeId) {
        const { data } = await pharmacyIntegrationApi.verifyMarking({
          storeId,
          code: rawCode,
        });
        if (data?.alreadySold) {
          toast.error(t('pharmacyStock.marks.alreadySold'));
          return false;
        }
        if (data && data.found === false) {
          toast.error(t('pharmacyStock.marks.notFound'));
          return false;
        }
        aslStatus = data?.status || 'VERIFIED';
      }

      setMarksByLineId((prev) => ({
        ...prev,
        [line.id]: [...marksForLine(prev, line.id), { code, aslStatus }],
      }));
      toast.success(t('pharmacyStock.marks.added'));
      return true;
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('pharmacyStock.marks.verifyFailed'));
      return false;
    } finally {
      setBusyLineId(null);
    }
  }, [aslEnabled, marksByLineId, storeId, t]);

  return {
    marksByLineId,
    busyLineId,
    hydrateMarks,
    addMarkToLine,
    removeMark,
    clearLine,
  };
}
