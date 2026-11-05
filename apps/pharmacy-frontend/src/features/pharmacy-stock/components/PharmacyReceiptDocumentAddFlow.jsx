import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi } from '../../../api';
import { resolvePharmacyApiError } from '../../../pharmacy/errors/resolvePharmacyApiError';
import { invalidateProductCaches } from '../../../utils/productCache';
import { notifyPharmacyCatalogChanged } from '../utils/pharmacyCatalogChangedNotify';
import PharmacyProductModal from './PharmacyProductModal';
import PharmacyReceiptImportWizard from './PharmacyReceiptImportWizard';
import PharmacyReceiptLineModal from './PharmacyReceiptLineModal';
import PharmacyReceiptDocumentDraftToolbar from './PharmacyReceiptDocumentDraftToolbar';
import { usePharmacyReceiptImport } from '../hooks/usePharmacyReceiptImport';

/**
 * New product + file import for a draft receipt — lives on the document page toolbar.
 */
export default function PharmacyReceiptDocumentAddFlow({
  receiptId,
  storeId,
  defaultMarkup = 20,
  isDraft,
  marksSlot = null,
  onRefresh,
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [aboutProduct, setAboutProduct] = useState(null);

  const setReceipt = (data) => {
    qc.setQueryData(['pharmacy-receipt', receiptId], data);
    invalidateProductCaches(qc);
    notifyPharmacyCatalogChanged({ storeId: data?.storeId || storeId, reason: 'receipt-line' });
  };

  const importer = usePharmacyReceiptImport({
    receiptId,
    t,
    onImported: (data) => {
      setReceipt(data);
    },
  });

  useEffect(() => {
    if (!isDraft || !location.state?.openImport) return;
    importer.openFile();
    navigate(location.pathname, { replace: true, state: {} });
  }, [isDraft, location.state?.openImport]);

  const addLineMutation = useMutation({
    mutationFn: (line) => pharmacyWarehouseApi.addLine(receiptId, line),
    onSuccess: (res) => {
      toast.success(t('pharmacyStock.lineAdded'));
      setReceipt(res.data);
      setSelectedProduct(null);
    },
    onError: (e) => toast.error(resolvePharmacyApiError(e, t)),
  });

  if (!isDraft) return null;

  return (
    <>
      <PharmacyReceiptDocumentDraftToolbar
        t={t}
        onCreate={() => setCreateOpen(true)}
        onImport={importer.openFile}
        onRefresh={onRefresh}
        marksSlot={marksSlot}
      />
      <input
        ref={importer.fileRef}
        type="file"
        accept=".xlsx,.xls,.pdf,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={importer.onFile}
      />

      <PharmacyReceiptLineModal
        open={Boolean(selectedProduct) && !aboutProduct}
        onClose={() => {
          setSelectedProduct(null);
          setAboutProduct(null);
        }}
        t={t}
        product={selectedProduct}
        defaultMarkup={defaultMarkup}
        saving={addLineMutation.isPending}
        onAboutProduct={() => setAboutProduct(selectedProduct)}
        onSave={(payload) => addLineMutation.mutate(payload)}
      />

      <PharmacyProductModal
        open={createOpen || Boolean(aboutProduct)}
        product={aboutProduct}
        withReceiptLine={createOpen && !aboutProduct}
        defaultMarkup={defaultMarkup}
        storeId={storeId}
        onClose={() => {
          setCreateOpen(false);
          setAboutProduct(null);
        }}
        onSaved={(created, linePayload) => {
          setAboutProduct(null);
          setCreateOpen(false);
          if (linePayload && created?.id) {
            addLineMutation.mutate({ ...linePayload, productId: created.id });
            return;
          }
          if (created?.id) setSelectedProduct(created);
        }}
      />

      <PharmacyReceiptImportWizard t={t} imp={importer} />
    </>
  );
}
