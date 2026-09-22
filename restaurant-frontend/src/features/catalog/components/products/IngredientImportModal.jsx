import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Upload } from 'lucide-react';
import { BaseButton, BaseModal } from '../../../../components/ui';
import { productApi } from '../../../../api';
import { assertSpreadsheetFile } from '../../../../utils/assertSpreadsheet';
import { downloadSpreadsheet } from '../../../../utils/downloadSpreadsheet';
import { getBlobAwareApiErrorMessage } from '../../../../utils/blobApiError';
import { toastApiError } from '../../../../utils/apiError';
import '../../styles/ingredient-import-modal.css';

export default function IngredientImportModal({ t, defaultStoreId, onClose, onDone }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const downloadTemplate = async () => {
    setBusy(true);
    try {
      const res = await productApi.importTemplate();
      await downloadSpreadsheet(res.data, 'products_import_template');
      toast.success(t('rst.nomenclature.importTemplateDone'));
    } catch (e) {
      const msg = await getBlobAwareApiErrorMessage(e, t('rst.nomenclature.importFailed'));
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (e) => {
    const next = e.target.files?.[0];
    e.target.value = '';
    if (!next) return;
    setBusy(true);
    try {
      await assertSpreadsheetFile(next);
      const fd = new FormData();
      fd.append('file', next);
      const { data } = await productApi.importPreview(fd, 'CATALOG');
      setFile(next);
      setPreview(data);
    } catch (err) {
      setPreview(null);
      setFile(null);
      if (err?.message && !err.response) toast.error(err.message);
      else toastApiError(err, t('rst.nomenclature.importFailed'));
    } finally {
      setBusy(false);
    }
  };

  const runImport = async () => {
    if (!file) return;
    if (!defaultStoreId) {
      toast.error(t('stockModal.storeRequired'));
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await productApi.importUpload(fd, {
        strategy: 'AS_FILE',
        source: 'CATALOG',
        skipDuplicates: true,
        defaultStoreId: Number(defaultStoreId),
        rows: [],
      });
      const created = data?.created ?? 0;
      const skipped = data?.skipped ?? 0;
      if (created > 0) {
        toast.success(
          skipped > 0
            ? t('rst.nomenclature.importPartial', { created, skipped })
            : t('rst.nomenclature.importDone', { created }),
        );
        onDone?.();
        onClose();
      } else if (skipped > 0) {
        toast(t('rst.nomenclature.importOnlySkipped', { skipped }));
      } else {
        toast.error(data?.errors?.[0] ?? t('rst.nomenclature.importNothing'));
      }
    } catch (e) {
      toastApiError(e, t('rst.nomenclature.importFailed'));
    } finally {
      setBusy(false);
    }
  };

  const newCount = preview?.newRows ?? null;

  return (
    <BaseModal
      open
      title={t('rst.nomenclature.importTitle')}
      onClose={onClose}
      size="md"
      footer={(
        <>
          <BaseButton type="button" variant="secondary" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton type="button" onClick={runImport} disabled={busy || !file}>
            {busy ? t('common.loading') : t('rst.nomenclature.importSubmit')}
          </BaseButton>
        </>
      )}
    >
      <p className="rst-coming__text">{t('rst.nomenclature.importHint')}</p>
      <div className="rst-ing-import__actions">
        <BaseButton type="button" variant="secondary" onClick={downloadTemplate} disabled={busy}>
          <Download size={16} aria-hidden />
          {t('rst.nomenclature.importDownloadTemplate')}
        </BaseButton>
        <BaseButton type="button" variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
          <Upload size={16} aria-hidden />
          {t('rst.nomenclature.importPickFile')}
        </BaseButton>
        <input
          ref={fileRef}
          type="file"
          className="rst-ing-import__file"
          accept=".xlsx,.xls,.json"
          onChange={onFile}
        />
      </div>
      {file ? (
        <p className="rst-ing-import__file-name">
          {file.name}
          {newCount != null ? ` · ${t('rst.nomenclature.importPreviewNew', { count: newCount })}` : ''}
        </p>
      ) : null}
    </BaseModal>
  );
}
