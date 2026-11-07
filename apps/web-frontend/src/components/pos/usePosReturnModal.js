import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { printReturnReceiptWithToast } from '../../utils/printReturnReceipt';
import { isReadyReceiptLookup, parseReceiptLookupInput } from '../../utils/receiptLookup';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  buildReturnPayload,
  getReturnableLines,
  useReturnQtyState,
} from '../sale-return/SaleReturnLinesEditor';
import {
  posLookupSaleReceipt,
  posReturnSaleItems,
} from '../../services/pos/posReturnWithFiscal';
import { resolveMultikassaFiscalErrorMessage } from '../../services/multikassa';
import { resolvePharmacyApiError } from '../../pharmacy/errors/resolvePharmacyApiError';
import { RECEIPT_LOOKUP_DEBOUNCE_MS, parseLookupError } from './posReturnHelpers';

export function usePosReturnModal({ open, onClose, onSuccess, catalogKind }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [receiptQuery, setReceiptQuery] = useState('');
  const [reason, setReason] = useState('');
  const [sale, setSale] = useState(null);
  const [lookupPending, setLookupPending] = useState(false);
  const lastLookupRef = useRef('');
  const saleRef = useRef(null);
  const debouncedQuery = useDebouncedValue(receiptQuery, RECEIPT_LOOKUP_DEBOUNCE_MS);
  saleRef.current = sale;
  const { qtyByItemId, setQty, selectAllMax, totalSelected } = useReturnQtyState(sale, open && !!sale);

  const reset = useCallback(() => {
    setReceiptQuery('');
    setReason('');
    setSale(null);
    setLookupPending(false);
    lastLookupRef.current = '';
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const lookupReceipt = useCallback(
    async (query) => {
      const code = String(query ?? '').trim();
      if (!code) {
        setSale(null);
        return;
      }
      if (lastLookupRef.current === code && saleRef.current) {
        return;
      }

      setLookupPending(true);
      setSale(null);
      lastLookupRef.current = code;

      try {
        const data = await posLookupSaleReceipt(code, { catalogKind });
        if (data.status === 'VOIDED') {
          toast.error(t('pos.returnAlreadyVoided'));
          return;
        }
        if (getReturnableLines(data).length === 0) {
          toast.error(t('pos.returnNoItems'));
          return;
        }
        setSale(data);
        toast.success(t('pos.returnFound', { receipt: data.receiptNumber }));
      } catch (e) {
        if (lastLookupRef.current === code) {
          setSale(null);
        }
        toast.error(parseLookupError(e, t));
      } finally {
        setLookupPending(false);
      }
    },
    [t, catalogKind]
  );

  useEffect(() => {
    if (!open) return;
    if (!debouncedQuery || !isReadyReceiptLookup(debouncedQuery)) {
      if (!debouncedQuery) {
        setSale(null);
        lastLookupRef.current = '';
      }
      return;
    }
    lookupReceipt(debouncedQuery);
  }, [debouncedQuery, open, lookupReceipt]);

  const returnMutation = useMutation({
    mutationFn: ({ sale: s, qtyByItemId: qtys, reasonText }) => {
      const payload = buildReturnPayload(
        s,
        qtys,
        reasonText.trim() || t('pos.returnDefaultReason')
      );
      if (!payload.lines.length) {
        return Promise.reject(new Error(t('pos.returnSelectQty')));
      }
      return posReturnSaleItems({
        sale: s,
        payload,
        storeId: s.storeId,
        catalogKind,
      });
    },
    onSuccess: async (_data, vars) => {
      const returnReason = (vars?.reasonText || '').trim() || t('pos.returnDefaultReason');
      toast.success(t('pos.returnSuccess'));
      qc.invalidateQueries({ queryKey: ['my-sales'] });
      qc.invalidateQueries({ queryKey: ['sales-ledger'] });
      qc.invalidateQueries({ queryKey: ['returns'] });
      qc.invalidateQueries({ queryKey: ['cashier-shift'] });
      qc.invalidateQueries({ queryKey: ['pos-products'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-fefo-hints'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-lots'] });

      if (vars?.sale) {
        await printReturnReceiptWithToast({
          originalSale: vars.sale,
          qtyByItemId: vars.qtyByItemId,
          reason: returnReason,
          t,
        });
      }

      reset();
      onClose();
      onSuccess?.();
    },
    onError: (e) => toast.error(
      e?.code === 'MULTIKASSA_FISCAL_FAILED'
        || e?.code === 'MULTIKASSA_OFFLINE_BLOCKED'
        || e?.message === 'MULTIKASSA_OFFLINE_BLOCKED'
        ? resolveMultikassaFiscalErrorMessage(e, t, 'pos.returnFailed')
        : resolvePharmacyApiError(e, t, 'pos.returnFailed'),
    ),
  });

  const handleReceiptChange = (e) => {
    setReceiptQuery(parseReceiptLookupInput(e.target.value));
  };

  const handleSubmitReturn = () => {
    if (!sale || totalSelected <= 0 || returnMutation.isPending) return;
    returnMutation.mutate({
      sale,
      qtyByItemId,
      reasonText: reason,
    });
  };

  return {
    receiptQuery,
    reason,
    setReason,
    sale,
    lookupPending,
    qtyByItemId,
    setQty,
    selectAllMax,
    totalSelected,
    isSubmitting: returnMutation.isPending,
    handleReceiptChange,
    handleClose,
    handleSubmitReturn,
  };
}
