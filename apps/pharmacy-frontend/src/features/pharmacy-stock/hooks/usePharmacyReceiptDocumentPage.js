import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi, storeApi, supplierApi } from '../../../api';
import { resolvePharmacyApiError } from '../../../pharmacy/errors/resolvePharmacyApiError';
import { invalidateProductCaches } from '../../../utils/productCache';
import { notifyPharmacyCatalogChanged } from '../utils/pharmacyCatalogChangedNotify';
import { usePharmacyRowSelection } from './usePharmacyRowSelection';
import { usePharmacyReceiptRevalue } from './usePharmacyReceiptRevalue';
import { usePharmacyReceiptMassEdit } from './usePharmacyReceiptMassEdit';
import { usePharmacyReceiptMarks } from './usePharmacyReceiptMarks';
import { usePharmacyImportMarksAsk } from './usePharmacyImportMarksAsk';
import { usePharmacyIntegrationConfig } from '../../pharmacy-cashier/hooks/usePharmacyIntegrationConfig';
import { PHARMACY_STOCK_PATHS } from '../pharmacyStockPaths';
import { linesReadyForActivate } from '../utils/pharmacyReceiptPricing';
import { receiptDisplayTotals } from '../utils/pharmacyReceiptTotals';
import {
  resolveStoreName,
  resolveSupplierName,
} from '../utils/pharmacyReceiptDisplayMeta';
import {
  flattenReceiptMarks,
  receiptMarksProgress,
} from '../utils/pharmacyReceiptMarks';
import { useClientTablePage } from '../utils/pharmacyTablePage';

/** Данные и мутации страницы документа прихода. */
export function usePharmacyReceiptDocumentPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [aboutProduct, setAboutProduct] = useState(null);
  const [lineToDelete, setLineToDelete] = useState(null);
  const [markScanOpen, setMarkScanOpen] = useState(false);

  const receiptQuery = useQuery({
    queryKey: ['pharmacy-receipt', id],
    queryFn: () => pharmacyWarehouseApi.getReceipt(id).then((r) => r.data),
    enabled: Boolean(id),
  });

  const suppliersQuery = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => supplierApi.getAll({ page: 0, size: 200 }).then((r) => r.data),
  });

  const storesQuery = useQuery({
    queryKey: ['stores-all'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (body) => pharmacyWarehouseApi.updateDraft(id, body),
    onSuccess: (res) => {
      toast.success(t('pharmacyStock.saved'));
      qc.setQueryData(['pharmacy-receipt', id], res.data);
      setEditOpen(false);
    },
    onError: (e) => toast.error(resolvePharmacyApiError(e, t)),
  });

  const updateLineMutation = useMutation({
    mutationFn: async ({ lineId, payload }) => {
      await pharmacyWarehouseApi.updateLine(id, lineId, payload);
      const fresh = await pharmacyWarehouseApi.getReceipt(id, { timeout: 180000 });
      return fresh.data;
    },
    onSuccess: (data) => {
      toast.success(t('pharmacyStock.saved'));
      qc.setQueryData(['pharmacy-receipt', id], data);
      invalidateProductCaches(qc);
      notifyPharmacyCatalogChanged({ storeId: data?.storeId, reason: 'receipt-line' });
      setEditingLine(null);
    },
    onError: (e) => toast.error(resolvePharmacyApiError(e, t)),
  });

  const deleteDraftMutation = useMutation({
    mutationFn: () => pharmacyWarehouseApi.deleteDraft(id),
    onSuccess: () => {
      toast.success(t('pharmacyStock.deleteDraftDone'));
      setDeleteOpen(false);
      qc.invalidateQueries({ queryKey: ['pharmacy-receipts'] });
      navigate(PHARMACY_STOCK_PATHS.receipts);
    },
    onError: (e) => toast.error(resolvePharmacyApiError(e, t)),
  });

  const removeLineMutation = useMutation({
    mutationFn: (lineId) => pharmacyWarehouseApi.removeLine(id, lineId),
    onSuccess: (res) => {
      toast.success(t('pharmacyStock.deleteLineDone'));
      qc.setQueryData(['pharmacy-receipt', id], res.data);
      invalidateProductCaches(qc);
      notifyPharmacyCatalogChanged({ storeId: res.data?.storeId, reason: 'receipt-line-delete' });
      setLineToDelete(null);
      setEditingLine((prev) => (prev?.id === lineToDelete?.id ? null : prev));
    },
    onError: (e) => toast.error(resolvePharmacyApiError(e, t)),
  });

  const receiptPreview = receiptQuery.data;
  const integration = usePharmacyIntegrationConfig(receiptPreview?.storeId);
  const aslEnabled = false;
  const aslReady = Boolean(receiptPreview?.storeId) && !integration.isLoading;
  const receiptMarks = usePharmacyReceiptMarks({ t });
  const { hydrateMarks } = receiptMarks;

  const importMarksAsk = usePharmacyImportMarksAsk({
    receiptId: id,
    lines: receiptPreview?.lines,
    storeId: receiptPreview?.storeId,
    aslEnabled,
    aslReady,
    hydrateMarks,
    t,
    showHint: Boolean(location.state?.importMarksHint),
  });

  const activateMutation = useMutation({
    mutationFn: async () => {
      const marks = flattenReceiptMarks(receiptMarks.marksByLineId, receiptQuery.data?.lines ?? []);
      const posted = await pharmacyWarehouseApi.activate(
        id,
        marks.length ? { marks } : {},
      );
      const fresh = await pharmacyWarehouseApi.getReceipt(id, { timeout: 180000 });
      return { posted: posted.data, receipt: fresh.data };
    },
    onSuccess: ({ posted, receipt: data }) => {
      toast.success(t('pharmacyStock.activated', { no: posted.receiptNumber || data.receiptNumber }));
      invalidateProductCaches(qc);
      notifyPharmacyCatalogChanged({ storeId: data?.storeId, reason: 'receipt-activate' });
      qc.setQueryData(['pharmacy-receipt', id], data);
      qc.invalidateQueries({ queryKey: ['pharmacy-receipts'] });
      setActivateOpen(false);
    },
    onError: (e) => toast.error(resolvePharmacyApiError(e, t, 'pharmacyStock.activateFailed')),
  });

  const receiptRaw = receiptQuery.data;
  const suppliers = suppliersQuery.data?.content ?? [];
  const stores = Array.isArray(storesQuery.data) ? storesQuery.data : (storesQuery.data?.content ?? []);
  const receipt = receiptRaw
    ? {
        ...receiptRaw,
        storeName: resolveStoreName(receiptRaw, stores),
        supplierName: resolveSupplierName(receiptRaw, suppliers),
      }
    : null;
  const isDraft = receipt?.status === 'DRAFT';
  const isPosted = receipt?.status === 'POSTED';
  const canEditPrices = isDraft || isPosted;
  const canActivate = linesReadyForActivate(receipt?.lines);
  const marksProgress = receiptMarksProgress(receipt?.lines ?? [], receiptMarks.marksByLineId);
  const linesPage = useClientTablePage(receipt?.lines ?? [], id);
  const linesSelect = usePharmacyRowSelection(linesPage.rows, id);
  const revalue = usePharmacyReceiptRevalue({
    receiptId: id,
    lines: receipt?.lines ?? [],
    selection: linesSelect,
    t,
    onUpdated: (data) => {
      qc.setQueryData(['pharmacy-receipt', id], data);
      invalidateProductCaches(qc);
      notifyPharmacyCatalogChanged({ storeId: data?.storeId, reason: 'receipt-revalue' });
    },
  });
  const mass = usePharmacyReceiptMassEdit({
    receiptId: id,
    lines: receipt?.lines ?? [],
    selection: linesSelect,
    t,
    onUpdated: (data) => {
      qc.setQueryData(['pharmacy-receipt', id], data);
      invalidateProductCaches(qc);
      notifyPharmacyCatalogChanged({ storeId: data?.storeId, reason: 'receipt-mass' });
    },
  });

  const removeSelectedLines = useMutation({
    mutationFn: async (lineIds) => {
      let last = receiptQuery.data;
      for (const lineId of lineIds) {
        const res = await pharmacyWarehouseApi.removeLine(id, lineId);
        last = res.data;
      }
      return last;
    },
    onSuccess: (data) => {
      toast.success(t('pharmacyStock.deleteLineDone'));
      qc.setQueryData(['pharmacy-receipt', id], data);
      invalidateProductCaches(qc);
      notifyPharmacyCatalogChanged({ storeId: data?.storeId, reason: 'receipt-line-delete' });
      linesSelect.clearSelection();
      setLineToDelete(null);
    },
    onError: (e) => toast.error(resolvePharmacyApiError(e, t)),
  });

  return {
    t,
    navigate,
    id,
    receiptQuery,
    receipt,
    suppliers,
    isDraft,
    isPosted,
    canEditPrices,
    canActivate,
    marksProgress,
    linesPage,
    linesSelect,
    revalue,
    mass,
    docTotals: receipt ? receiptDisplayTotals(receipt) : null,
    receiptMarks,
    aslEnabled,
    aslReady,
    importMarksAsk,
    editOpen,
    setEditOpen,
    activateOpen,
    setActivateOpen,
    deleteOpen,
    setDeleteOpen,
    editingLine,
    setEditingLine,
    aboutProduct,
    setAboutProduct,
    lineToDelete,
    setLineToDelete,
    markScanOpen,
    setMarkScanOpen,
    updateMutation,
    updateLineMutation,
    removeLineMutation,
    removeSelectedLines,
    activateMutation,
    deleteDraftMutation,
    openActivate: () => {
      if (!canActivate) {
        toast.error(t('pharmacyStock.activateNeedLots'));
        return;
      }
      setActivateOpen(true);
    },
  };
}
