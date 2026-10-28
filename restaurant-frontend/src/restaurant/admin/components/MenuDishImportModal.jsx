import { Download, Search, Upload } from 'lucide-react';
import { BaseButton, BaseModal } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { useMenuDishImport } from '../hooks/useMenuDishImport';
import MenuDishImportRowEditor from './MenuDishImportRowEditor';
import '../styles/menu-dish-import-modal.css';

function rowStatus(row, t) {
  if (!row.ok) return t('rst.admin.menuImportStatusError');
  if (row.action === 'UPDATE') return t('rst.admin.menuImportStatusUpdate');
  return t('rst.admin.menuImportStatusCreate');
}

function tasnifLabel(row, t) {
  if (row.tasnifStatus === 'ok') return t('rst.admin.menuImportTasnifShortOk');
  if (row.tasnifStatus === 'miss') return t('rst.admin.menuImportTasnifShortMiss');
  if (row.tasnifStatus === 'loading') return '…';
  if (row.tasnifStatus === 'skip') return t('rst.admin.menuImportTasnifShortSkip');
  return t('rst.admin.menuImportTasnifShortIdle');
}

export default function MenuDishImportModal({
  storeId,
  items,
  stations,
  menuCategories,
  onClose,
}) {
  const imp = useMenuDishImport({
    storeId,
    items,
    stations,
    menuCategories,
    onClose,
  });

  return (
    <BaseModal
      open
      title={imp.t('rst.admin.menuImportTitle')}
      onClose={onClose}
      size="lg"
      className="rst-menu-import-modal"
      footer={(
        <>
          <BaseButton type="button" variant="secondary" onClick={onClose} disabled={imp.busy}>
            {imp.t('common.cancel')}
          </BaseButton>
          <BaseButton type="button" onClick={imp.runImport} disabled={!imp.canImport}>
            {imp.busy
              ? imp.t('common.loading')
              : imp.t('rst.admin.menuImportSubmit', { count: imp.usableRows.length })}
          </BaseButton>
        </>
      )}
    >
      <p className="rst-coming__text">{imp.t('rst.admin.menuImportHint')}</p>

      <div className="rst-menu-import__actions">
        <BaseButton type="button" variant="secondary" onClick={imp.downloadTemplate} disabled={imp.busy}>
          <Download size={16} aria-hidden />
          {imp.t('rst.admin.menuImportDownloadTemplate')}
        </BaseButton>
        <BaseButton type="button" variant="secondary" onClick={imp.pickFile} disabled={imp.busy}>
          <Upload size={16} aria-hidden />
          {imp.t('rst.admin.menuImportPickFile')}
        </BaseButton>
        <BaseButton
          type="button"
          variant="secondary"
          onClick={imp.analyzeTasnif}
          disabled={imp.busy || !imp.rows.length}
        >
          <Search size={16} aria-hidden />
          {imp.t('rst.admin.menuImportAnalyzeTasnif')}
        </BaseButton>
        <input
          ref={imp.fileRef}
          type="file"
          className="rst-menu-import__file"
          accept=".xlsx,.xls"
          onChange={imp.onFile}
        />
      </div>

      <label className="rst-menu-import__option">
        <input
          type="checkbox"
          checked={imp.fillTasnif}
          disabled={imp.busy}
          onChange={(e) => imp.setFillTasnif(e.target.checked)}
        />
        <span>{imp.t('rst.admin.menuImportFillTasnif')}</span>
      </label>

      {imp.file ? (
        <p className="rst-menu-import__meta">
          {imp.file.name}
          {` · ${imp.t('rst.admin.menuImportPreviewMeta', {
            ok: imp.usableRows.length,
            err: imp.errorCount,
          })}`}
        </p>
      ) : null}

      {imp.rows.length > 0 ? (
        <div className="rst-menu-import__workspace">
          <div className="rst-menu-import__table-wrap">
            <table className="rst-menu-import__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{imp.t('rst.admin.dishName')}</th>
                  <th className="is-num">{imp.t('rst.admin.price')}</th>
                  <th>{imp.t('rst.admin.menuImportColPhoto')}</th>
                  <th>{imp.t('rst.admin.menuImportColTasnif')}</th>
                  <th>{imp.t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {imp.rows.map((row) => (
                  <tr
                    key={row.rowNum}
                    className={[
                      row.ok ? '' : 'is-err',
                      row.rowNum === imp.selectedRowNum ? 'is-selected' : '',
                    ].filter(Boolean).join(' ') || undefined}
                    onClick={() => imp.setSelectedRowNum(row.rowNum)}
                  >
                    <td>{row.rowNum}</td>
                    <td>{row.name || '—'}</td>
                    <td className="is-num">{fmtMoneyCompact(row.price)}</td>
                    <td>{row.hasPhoto || row.draft?.imageUrl ? '✓' : '—'}</td>
                    <td>{tasnifLabel(row, imp.t)}</td>
                    <td className={row.ok ? undefined : 'is-err'}>{rowStatus(row, imp.t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <MenuDishImportRowEditor
            row={imp.selectedRow}
            t={imp.t}
            stations={imp.stations}
            menuCategories={imp.menuCategories}
            disabled={imp.busy}
            onChange={imp.updateSelected}
            onImageFile={imp.onRowImageFile}
          />
        </div>
      ) : null}

      {imp.progress ? (
        <p className="rst-menu-import__progress">
          {imp.t('rst.admin.menuImportProgress', {
            done: imp.progress.done,
            total: imp.progress.total,
          })}
        </p>
      ) : null}
    </BaseModal>
  );
}
