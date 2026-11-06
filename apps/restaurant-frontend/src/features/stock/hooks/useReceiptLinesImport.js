import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { productApi } from '../../../api';
import { assertSpreadsheetFile } from '../../../utils/assertSpreadsheet';
import { downloadSpreadsheet } from '../../../utils/downloadSpreadsheet';
import { getBlobAwareApiErrorMessage } from '../../../utils/blobApiError';
import { toastApiError } from '../../../utils/apiError';
import { emptyReceiptLine } from '../utils/stockDocumentFormUtils';

async function findProductBySku(sku, storeId) {
  const q = String(sku || '').trim();
  if (!q) return null;
  const { data } = await productApi.getAll({
    search: q,
    page: 0,
    size: 10,
    activeOnly: true,
    storeId: storeId ?? undefined,
  });
  const rows = data?.content ?? [];
  const lower = q.toLowerCase();
  return rows.find((p) => String(p.sku || '').toLowerCase() === lower) || rows[0] || null;
}

function lineFromProduct(product, previewRow) {
  const qty = previewRow?.quantity != null && Number(previewRow.quantity) > 0
    ? String(previewRow.quantity)
    : '1';
  const sell = previewRow?.fileSellingPrice != null
    ? String(previewRow.fileSellingPrice)
    : String(product?.sellingPrice ?? '');
  const cost = previewRow?.costPrice != null && Number(previewRow.costPrice) > 0
    ? String(previewRow.costPrice)
    : sell;
  return {
    ...emptyReceiptLine(),
    productId: product.id,
    productName: product.name,
    sku: product.sku || previewRow?.sku || '',
    quantity: qty,
    purchasePrice: cost,
    unitSellingPrice: sell || cost,
  };
}

/**
 * Excel import for receipt lines — same product import API as catalog.
 */
export function useReceiptLinesImport({ t, storeId, onApplyLines, onClose }) {
  const fileRef = useRef(null);
  const [source, setSource] = useState('CATALOG');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const downloadTemplate = async () => {
    setBusy(true);
    try {
      const res = await productApi.importTemplate();
      await downloadSpreadsheet(res.data, 'receipt_products_template');
      toast.success(t('stockReports.linesImportTemplateDone'));
    } catch (e) {
      toast.error(await getBlobAwareApiErrorMessage(e, t('stockReports.linesImportFailed')));
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (event) => {
    const next = event.target.files?.[0];
    event.target.value = '';
    if (!next) return;
    setBusy(true);
    try {
      const name = String(next.name || '').toLowerCase();
      const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
      if (isExcel || source === 'CATALOG') {
        await assertSpreadsheetFile(next);
      }
      const fd = new FormData();
      fd.append('file', next);
      const { data } = await productApi.importPreview(fd, source);
      setFile(next);
      setPreview(data);
      if (!(data?.rows?.length)) {
        toast.error(t('stockReports.linesImportEmpty'));
      }
    } catch (err) {
      setFile(null);
      setPreview(null);
      if (err?.message && !err.response) {
        toast.error(err.message);
      } else {
        toastApiError(err, t('stockReports.linesImportFailed'));
      }
    } finally {
      setBusy(false);
    }
  };

  const runImport = async () => {
    if (!file || !preview?.rows?.length) return;
    if (!storeId) {
      toast.error(t('stockModal.storeRequired'));
      return;
    }
    setBusy(true);
    try {
      const rows = preview.rows.filter(
        (r) => r.status === 'NEW' || r.status === 'DUPLICATE',
      );
      if (!rows.length) {
        toast.error(t('stockReports.linesImportEmpty'));
        return;
      }

      // Create only NEW products with initialStock=0 so receipt posts stock once.
      const newRows = rows.filter((r) => r.status === 'NEW');
      if (newRows.length) {
        for (const row of newRows) {
          const sell = Number(row.fileSellingPrice) || 0.01;
          const cost = Number(row.costPrice) > 0 ? Number(row.costPrice) : sell;
          await productApi.create({
            sku: row.sku,
            name: row.name,
            costPrice: cost,
            sellingPrice: sell,
            defaultDiscountPercent: 0,
            taxRate: Number(row.taxRatePercent) || 0,
            productType: 'RETAIL',
            saleType: row.saleType === 'WEIGHT' ? 'WEIGHT' : 'PIECE',
            unitCode: row.saleType === 'WEIGHT' ? 'KG' : 'PCS',
            quantityScale: row.saleType === 'WEIGHT' ? 3 : 0,
            allowFraction: row.saleType === 'WEIGHT',
            unitOfMeasure: row.unitOfMeasure || 'pcs',
            soldIndividually: true,
            markedProduct: false,
            ownerType: 'OWN',
            lowStockAlert: 10,
            businessTypeCode: 'RESTAURANT',
            barcode: row.barcode || undefined,
            ikpu: row.ikpu || undefined,
            initialStock: 0,
            storePrices: [{ storeId: Number(storeId), price: sell }],
            additionalBarcodes: [],
          });
        }
      }

      const lines = [];
      let matched = 0;
      const missed = [];
      for (const row of rows) {
        const product = await findProductBySku(row.existingSku || row.sku, storeId);
        if (!product) {
          missed.push(row.sku || row.name);
          continue;
        }
        matched += 1;
        lines.push(lineFromProduct(product, row));
      }

      if (!lines.length) {
        toast.error(t('stockReports.linesImportNothing'));
        return;
      }

      onApplyLines(lines);
      if (missed.length) {
        toast(
          t('stockReports.linesImportPartial', { matched, missed: missed.length }),
          { duration: 5000 },
        );
      } else {
        toast.success(t('stockReports.linesImportDone', { count: matched }));
      }
      onClose?.();
    } catch (e) {
      toastApiError(e, t('stockReports.linesImportFailed'));
    } finally {
      setBusy(false);
    }
  };

  const usableRows = preview?.rows?.filter((r) => r.status === 'NEW' || r.status === 'DUPLICATE') ?? [];
  const newCount = preview?.newRows ?? usableRows.filter((r) => r.status === 'NEW').length;
  const dupCount = preview?.duplicateRows ?? usableRows.filter((r) => r.status === 'DUPLICATE').length;

  return {
    fileRef,
    source,
    setSource,
    file,
    preview,
    busy,
    usableRows,
    newCount,
    dupCount,
    downloadTemplate,
    pickFile: () => fileRef.current?.click(),
    onFile,
    runImport,
    canImport: Boolean(file && usableRows.length && storeId),
  };
}
