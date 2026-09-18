import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  matchPendingMarksToLines,
  takePendingImportMarks,
} from '../utils/pharmacyReceiptPendingMarksStore';
import { summarizeImportAslVerify } from '../utils/summarizeImportAslVerify';
import {
  countImportMarks,
  estimateImportVerifySeconds,
  verifyImportMarksAgainstAsl,
} from '../utils/verifyImportMarksAgainstAsl';

/**
 * После Excel-импорта: спросить, проверять ли КМ в ASL, затем полная проверка и точный итог.
 */
export function usePharmacyImportMarksAsk({
  receiptId,
  lines,
  storeId,
  aslEnabled,
  hydrateMarks,
  t,
  showHint,
}) {
  const takenRef = useRef(false);
  const [askOpen, setAskOpen] = useState(false);
  const [pendingByLine, setPendingByLine] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState(null);

  useEffect(() => {
    takenRef.current = false;
    setAskOpen(false);
    setPendingByLine(null);
    setVerifying(false);
    setProgress({ done: 0, total: 0 });
    setResult(null);
  }, [receiptId]);

  useEffect(() => {
    if (!receiptId || !lines?.length || takenRef.current) return;
    const pending = takePendingImportMarks(receiptId);
    takenRef.current = true;
    if (!pending.length) return;
    const byLine = matchPendingMarksToLines(lines, pending);
    if (!Object.keys(byLine).length) return;
    setPendingByLine(byLine);
    setAskOpen(true);
  }, [receiptId, lines]);

  const markCount = countImportMarks(pendingByLine);
  const etaSeconds = estimateImportVerifySeconds(markCount);

  const applyAndClose = useCallback((byLine, { verified }) => {
    hydrateMarks(byLine);
    setAskOpen(false);
    setPendingByLine(null);
    setProgress({ done: 0, total: 0 });
    setResult(null);
    if (showHint || verified) {
      toast.success(
        verified
          ? t('pharmacyStock.marks.importHydratedVerified')
          : t('pharmacyStock.marks.importHydrated'),
      );
    }
  }, [hydrateMarks, showHint, t]);

  const skipVerify = useCallback(() => {
    if (verifying || result) return;
    if (!pendingByLine) return;
    applyAndClose(pendingByLine, { verified: false });
  }, [applyAndClose, pendingByLine, result, verifying]);

  const confirmResult = useCallback(() => {
    if (!result) return;
    applyAndClose(result.accepted, { verified: true });
  }, [applyAndClose, result]);

  const runVerify = useCallback(async () => {
    if (!pendingByLine || !storeId || verifying || result) return;
    if (!aslEnabled) {
      toast.error(t('pharmacyStock.marks.importAslDisabled'));
      return;
    }
    setVerifying(true);
    setProgress({ done: 0, total: markCount });
    try {
      const { accepted, rejected } = await verifyImportMarksAgainstAsl({
        byLineId: pendingByLine,
        storeId,
        onProgress: (p) => setProgress({ done: p.done, total: p.total }),
      });
      setResult({
        accepted,
        summary: summarizeImportAslVerify(accepted, rejected),
      });
    } catch (error) {
      toast.error(error?.response?.data?.message ?? t('pharmacyStock.marks.verifyFailed'));
    } finally {
      setVerifying(false);
    }
  }, [aslEnabled, markCount, pendingByLine, result, storeId, t, verifying]);

  const closeAsk = useCallback(() => {
    if (verifying || result) return;
    skipVerify();
  }, [result, skipVerify, verifying]);

  return {
    askOpen,
    markCount,
    etaSeconds,
    verifying,
    progress,
    resultSummary: result?.summary || null,
    runVerify,
    skipVerify,
    confirmResult,
    closeAsk,
  };
}
