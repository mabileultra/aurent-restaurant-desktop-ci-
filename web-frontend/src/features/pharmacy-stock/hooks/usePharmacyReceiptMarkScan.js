import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { pharmacyIntegrationApi } from '../../../api';
import { isAslMarkAlreadySold } from '../../pharmacy-cashier/utils/aslMarkingAlreadySold';
import {
  isCompletePharmacyMarkingScan,
  isPharmacyMarkingCode,
  normalizePharmacyMarkingCode,
} from '../../pharmacy-cashier/utils/pharmacyMarkingCode';
import { matchReceiptLineByMarking } from '../utils/matchReceiptLineByMarking';

/**
 * Скан КМ в модалке прихода: ASL → найти строку → добавить.
 */
export function usePharmacyReceiptMarkScan({
  lines,
  marksByLineId,
  storeId,
  aslEnabled,
  acceptVerifiedMark,
  t,
}) {
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastHit, setLastHit] = useState(null);
  const [pinnedLineId, setPinnedLineId] = useState(null);
  const pendingRef = useRef(false);

  const resolveLine = useCallback((rawCode, extraGtins = []) => {
    if (pinnedLineId) {
      const pinned = (lines || []).find((line) => line.id === pinnedLineId);
      if (pinned) return pinned;
    }
    return matchReceiptLineByMarking(lines, rawCode, extraGtins, marksByLineId);
  }, [lines, marksByLineId, pinnedLineId]);

  const processCode = useCallback(async (rawCode) => {
    const code = normalizePharmacyMarkingCode(rawCode);
    if (!code || (!isPharmacyMarkingCode(rawCode) && !isCompletePharmacyMarkingScan(rawCode))) {
      toast.error(t('pharmacyStock.marks.invalidCode'));
      return false;
    }
    if (pendingRef.current) return false;
    pendingRef.current = true;
    setBusy(true);
    try {
      let aslResult = null;
      if (aslEnabled && storeId) {
        const { data } = await pharmacyIntegrationApi.verifyMarking({
          storeId,
          code: rawCode,
        });
        aslResult = data;
        if (isAslMarkAlreadySold(data)) {
          toast.error(t('pharmacyStock.marks.alreadySold'));
          setLastHit({ status: 'sold', code });
          return false;
        }
        if (data && data.found === false) {
          toast.error(t('pharmacyStock.marks.notFound'));
          setLastHit({ status: 'missing', code });
          return false;
        }
      }
      const extra = aslResult?.gtin ? [aslResult.gtin] : [];
      const line = resolveLine(rawCode, extra);
      if (!line) {
        toast.error(t('pharmacyStock.marks.noLineForCode'));
        setLastHit({ status: 'no-line', code, aslResult });
        return false;
      }
      const ok = acceptVerifiedMark(line, rawCode, aslResult?.status || (aslEnabled ? 'VERIFIED' : 'SCAN'));
      if (ok) {
        setDraft('');
        setLastHit({ status: 'ok', code, line, aslResult });
      }
      return ok;
    } catch (error) {
      toast.error(error.response?.data?.message ?? t('pharmacyStock.marks.verifyFailed'));
      setLastHit({ status: 'error', code });
      return false;
    } finally {
      pendingRef.current = false;
      setBusy(false);
    }
  }, [acceptVerifiedMark, aslEnabled, resolveLine, storeId, t]);

  const onDraftChange = useCallback((value) => {
    setDraft(value);
    if (isCompletePharmacyMarkingScan(value)) {
      void processCode(value);
    }
  }, [processCode]);

  const submitDraft = useCallback(() => {
    if (!draft.trim() || busy) return;
    void processCode(draft);
  }, [busy, draft, processCode]);

  return {
    draft,
    setDraft: onDraftChange,
    query,
    setQuery,
    busy,
    lastHit,
    pinnedLineId,
    setPinnedLineId,
    submitDraft,
  };
}
