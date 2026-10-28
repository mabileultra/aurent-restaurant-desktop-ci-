import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rstMenuApi } from '../../api/menu.api';
import { assertSpreadsheetFile } from '../../../utils/assertSpreadsheet';
import { readImageDataUrl } from '../../../utils/readImageDataUrl';
import { toastApiError } from '../../../utils/apiError';
import { patchMenuDishImportRow } from '../utils/menuDishImportRow';
import {
  normalizeMenuDishImportRow,
  parseMenuDishWorkbook,
} from '../utils/menuDishSpreadsheet';
import { resolveMenuDishImportImage } from '../utils/resolveMenuDishImportImage';
import { resolveMenuDishTasnif } from '../utils/resolveMenuDishTasnif';
import { runWithConcurrency } from '../utils/runWithConcurrency';
import { useMenuDishExport } from './useMenuDishExport';

/** Parallel API calls — enough for speed, not enough to DDOS tasnif/API. */
const TASNIF_CONCURRENCY = 6;
const SAVE_CONCURRENCY = 5;

/**
 * Excel import workspace: preview → per-row edit → parallel tasnif/save.
 */
export function useMenuDishImport({
  storeId,
  items,
  stations,
  menuCategories,
  onClose,
}) {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const rowsRef = useRef([]);
  const [file, setFile] = useState(null);
  const [rows, setRowsState] = useState([]);
  const [selectedRowNum, setSelectedRowNum] = useState(null);
  const [busy, setBusy] = useState(false);
  const [fillTasnif, setFillTasnif] = useState(true);
  const [progress, setProgress] = useState(null);

  const setRows = (next) => {
    const value = typeof next === 'function' ? next(rowsRef.current) : next;
    rowsRef.current = value;
    setRowsState(value);
  };

  const exporter = useMenuDishExport({
    t,
    items,
    stations,
    menuCategories,
  });

  const usableRows = useMemo(() => rows.filter((row) => row.ok), [rows]);
  const errorCount = useMemo(() => rows.filter((row) => !row.ok).length, [rows]);
  const canImport = usableRows.length > 0 && !busy;
  const selectedRow = useMemo(
    () => rows.find((row) => row.rowNum === selectedRowNum) || null,
    [rows, selectedRowNum],
  );

  const pickFile = () => fileRef.current?.click();

  const remap = (parsedList) => (parsedList || []).map((parsed) => normalizeMenuDishImportRow(parsed, {
    stations,
    menuCategories,
    existingItems: items,
  }));

  const onFile = async (event) => {
    const next = event.target.files?.[0];
    event.target.value = '';
    if (!next) return;
    setBusy(true);
    try {
      await assertSpreadsheetFile(next);
      const buffer = await next.arrayBuffer();
      // Yield so the file-picker UI can close before heavy XLSX parse.
      await new Promise((resolve) => setTimeout(resolve, 0));
      const parsed = await parseMenuDishWorkbook(buffer);
      if (!parsed.length) {
        setFile(null);
        setRows([]);
        setSelectedRowNum(null);
        toast.error(t('rst.admin.menuImportEmpty'));
        return;
      }
      const normalized = remap(parsed);
      setFile(next);
      setRows(normalized);
      setSelectedRowNum(normalized[0]?.rowNum ?? null);
      toast.success(t('rst.admin.menuImportPreviewReady', { count: normalized.length }));
    } catch (err) {
      setFile(null);
      setRows([]);
      setSelectedRowNum(null);
      if (err?.message === 'NO_HEADERS') {
        toast.error(t('rst.admin.menuImportBadHeaders'));
      } else if (err?.message && !err.response) {
        toast.error(err.message);
      } else {
        toastApiError(err, t('rst.admin.menuImportFailed'));
      }
    } finally {
      setBusy(false);
    }
  };

  const updateSelected = (patch) => {
    if (selectedRowNum == null) return;
    setRows((prev) => prev.map((row) => (
      row.rowNum === selectedRowNum
        ? patchMenuDishImportRow(row, patch, { stations, menuCategories })
        : row
    )));
  };

  const analyzeOneQuiet = async (row) => {
    if (!row?.ok) return row;
    if (row.draft?.ikpu) {
      return patchMenuDishImportRow(row, { tasnifStatus: 'ok' }, { stations, menuCategories });
    }
    const lang = i18n.language?.startsWith('ru') ? 'ru' : 'uz';
    const resolved = await resolveMenuDishTasnif(row.tasnifQuery || row.name, {
      lang,
      fillSku: !row.draft?.sku,
    });
    if (resolved.ok && resolved.patch) {
      return patchMenuDishImportRow(row, {
        ...resolved.patch,
        tasnifStatus: 'ok',
        tasnifMatchedName: resolved.matchedName || '',
      }, { stations, menuCategories });
    }
    return patchMenuDishImportRow(row, {
      tasnifStatus: 'miss',
      tasnifMatchedName: '',
    }, { stations, menuCategories });
  };

  const analyzeTasnif = async () => {
    if (!rowsRef.current.length || busy) return;
    setBusy(true);
    setProgress({ done: 0, total: rowsRef.current.length });
    try {
      if (!fillTasnif) {
        setRows(rowsRef.current.map((row) => patchMenuDishImportRow(row, {
          tasnifStatus: row.draft?.ikpu ? 'ok' : 'skip',
        }, { stations, menuCategories })));
        toast.success(t('rst.admin.menuImportTasnifDone', { ok: 0, miss: 0 }));
        return;
      }

      setRows(rowsRef.current.map((row) => (
        row.ok && !row.draft?.ikpu
          ? patchMenuDishImportRow(row, { tasnifStatus: 'loading' }, { stations, menuCategories })
          : row
      )));

      const source = [...rowsRef.current];
      const analyzed = await runWithConcurrency(
        source,
        TASNIF_CONCURRENCY,
        (row) => analyzeOneQuiet(row),
        {
          onProgress: (done, total, result, index) => {
            source[index] = result;
            if (done === total || done % 3 === 0) {
              setRows([...source]);
              setProgress({ done, total });
            }
          },
        },
      );
      setRows(analyzed);
      const ok = analyzed.filter((r) => r.tasnifStatus === 'ok').length;
      const miss = analyzed.filter((r) => r.tasnifStatus === 'miss').length;
      toast.success(t('rst.admin.menuImportTasnifDone', { ok, miss }));
    } catch (err) {
      toastApiError(err, t('rst.admin.menuImportFailed'));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const onRowImageFile = async (fileObj) => {
    if (!fileObj || selectedRowNum == null) return;
    try {
      const dataUrl = await readImageDataUrl(fileObj, 400 * 1024);
      updateSelected({ imageUrl: dataUrl });
      toast.success(t('rst.admin.menuImportPhotoAttached'));
    } catch {
      toast.error(t('rst.admin.imageUploadFailed'));
    }
  };

  const saveOne = async (row) => {
    let working = row;
    if (fillTasnif && !working.draft?.ikpu && working.tasnifStatus === 'idle') {
      working = await analyzeOneQuiet(working);
    }

    let draft = { ...working.draft };
    const hadIkpu = Boolean(draft.ikpu);
    let hadPhoto = false;

    if (draft.imageUrl) {
      const resolvedImage = await resolveMenuDishImportImage(draft.imageUrl);
      draft.imageUrl = resolvedImage;
      if (resolvedImage) hadPhoto = true;
    }

    try {
      if (working.existingId) {
        await rstMenuApi.update(working.existingId, draft);
        return { status: 'updated', hadIkpu, hadPhoto, row: working };
      }
      await rstMenuApi.create(storeId, draft);
      return { status: 'created', hadIkpu, hadPhoto, row: working };
    } catch {
      return { status: 'failed', hadIkpu, hadPhoto, row: working };
    }
  };

  const runImport = async () => {
    const toSave = rowsRef.current.filter((row) => row.ok);
    if (!storeId || !toSave.length || busy) return;
    setBusy(true);
    setProgress({ done: 0, total: toSave.length });

    let created = 0;
    let updated = 0;
    let tasnifFilled = 0;
    let photos = 0;
    let failed = 0;

    try {
      await runWithConcurrency(
        toSave,
        SAVE_CONCURRENCY,
        (row) => saveOne(row),
        {
          onProgress: (done, total, result) => {
            if (result.status === 'created') created += 1;
            if (result.status === 'updated') updated += 1;
            if (result.status === 'failed') failed += 1;
            if (result.hadIkpu) tasnifFilled += 1;
            if (result.hadPhoto) photos += 1;
            setProgress({ done, total });
          },
        },
      );

      await qc.invalidateQueries({ queryKey: ['rst-menu-admin', storeId] });
      await qc.invalidateQueries({ queryKey: ['rst-menu-pos', storeId] });

      if (failed && !created && !updated) {
        toast.error(t('rst.admin.menuImportFailed'));
        return;
      }
      toast.success(t('rst.admin.menuImportDone', {
        created,
        updated,
        tasnif: tasnifFilled,
        failed,
        photos,
      }));
      onClose?.();
    } catch (err) {
      toastApiError(err, t('rst.admin.menuImportFailed'));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return {
    t,
    fileRef,
    file,
    rows,
    usableRows,
    errorCount,
    selectedRow,
    selectedRowNum,
    setSelectedRowNum,
    updateSelected,
    onRowImageFile,
    analyzeTasnif,
    busy: busy || exporter.busy,
    fillTasnif,
    setFillTasnif,
    progress,
    canImport,
    pickFile,
    onFile,
    runImport,
    downloadTemplate: exporter.downloadTemplate,
    stations,
    menuCategories,
  };
}
