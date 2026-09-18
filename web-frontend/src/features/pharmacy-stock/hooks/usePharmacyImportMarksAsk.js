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
 * После Excel-импорта:
 * - ASL off → явный вопрос «продолжить без проверки / не добавлять КМ»
 * - ASL on → спросить про проверку, затем полный verify
 */
export function usePharmacyImportMarksAsk({
  receiptId,
  lines,
  storeId,
  aslEnabled,
  aslReady = true,
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
    // Ждём статус интеграции, иначе мелькнёт «ASL нет» при дефолте false.
    if (!aslReady) return;
    const pending = takePendingImportMarks(receiptId);
    takenRef.current = true;
    if (!pending.length) return;
    const byLine = matchPendingMarksToLines(lines, pending);
    if (!Object.keys(byLine).length) return;
    setPendingByLine(byLine);
    setAskOpen(true);
  }, [receiptId, lines, aslReady]);

  const markCount = countImportMarks(pendingByLine);
  const etaSeconds = estimateImportVerifySeconds(markCount);

  const clearAsk = useCallback(() => {
    setAskOpen(false);
    setPendingByLine(null);
    setProgress({ done: 0, total: 0 });
    setResult(null);
  }, []);

  const applyAndClose = useCallback((byLine, { verified }) => {
    hydrateMarks(byLine);
    clearAsk();
    if (showHint || verified) {
      toast.success(
        verified
          ? t('pharmacyStock.marks.importHydratedVerified')
          : t('pharmacyStock.marks.importHydrated'),
      );
    }
  }, [clearAsk, hydrateMarks, showHint, t]);

  /** Продолжить без ASL: КМ в документ без проверки. */
  const continueWithoutVerify = useCallback(() => {
    if (verifying || result) return;
    if (!pendingByLine) return;
    applyAndClose(pendingByLine, { verified: false });
  }, [applyAndClose, pendingByLine, result, verifying]);

  /** Не добавлять КМ из импорта (отмена при выключенной ASL). */
  const discardMarks = useCallback(() => {
    if (verifying || result) return;
    clearAsk();
    toast(t('pharmacyStock.marks.importAslDiscarded'), { icon: 'ℹ️' });
  }, [clearAsk, result, t, verifying]);

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
    if (!aslEnabled) {
      discardMarks();
      return;
    }
    continueWithoutVerify();
  }, [aslEnabled, continueWithoutVerify, discardMarks, result, verifying]);

  return {
    askOpen: askOpen && aslReady,
    markCount,
    etaSeconds,
    verifying,
    progress,
    resultSummary: result?.summary || null,
    runVerify,
    /** alias для модалки со ASL */
    skipVerify: continueWithoutVerify,
    continueWithoutVerify,
    discardMarks,
    confirmResult,
    closeAsk,
  };
}
