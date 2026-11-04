import { Search } from 'lucide-react';
import PharmacyReceiptImportMatchBar from './PharmacyReceiptImportMatchBar';
import PharmacyReceiptImportMatchTable from './PharmacyReceiptImportMatchTable';
import PharmacyReceiptImportRolePreview from './PharmacyReceiptImportRolePreview';

export default function PharmacyReceiptImportWizard({ t, imp }) {
  if (!imp.step) return null;

  const matchStep = imp.step === 'match';

  return (
    <div className="pharmacy-stock__import" role="dialog" aria-modal="true">
      <header className="pharmacy-stock__import-bar">
        <div className="pharmacy-stock__import-bar-left">
          <button type="button" className="pharmacy-stock__back" onClick={imp.close} aria-label={t('common.cancel')}>
            <span aria-hidden>←</span>
          </button>
          <h2 className="pharmacy-stock__title">
            {matchStep ? t('pharmacyStock.importMatchTitle') : t('pharmacyStock.importColumnsTitle')}
          </h2>
          {imp.invoiceId ? (
            <span className={`pharmacy-stock__import-chip${imp.invoiceAlreadyImported ? ' is-dup' : ''}`}>
              {imp.invoiceId}
            </span>
          ) : null}
        </div>
        <div className="pharmacy-stock__import-bar-right">
          {matchStep ? (
            <>
              <label className="pharmacy-stock__import-search">
                <input
                  value={imp.query}
                  onChange={(e) => imp.setQuery(e.target.value)}
                  placeholder={t('pharmacyStock.toolbarSearch')}
                />
                <Search size={15} strokeWidth={2.2} aria-hidden />
              </label>
              <button
                type="button"
                className="pharmacy-stock__import-btn pharmacy-stock__import-btn--stop"
                onClick={imp.close}
                disabled={imp.busy}
              >
                {t('pharmacyStock.importDiscard')}
              </button>
              <button
                type="button"
                className="pharmacy-stock__import-btn pharmacy-stock__import-btn--go"
                onClick={imp.confirm}
                disabled={imp.busy || imp.invoiceAlreadyImported}
              >
                {t('pharmacyStock.importMatch.addSelected', {
                  count: (imp.matchAllItems || []).filter((item) => item.selected).length,
                })}
              </button>
            </>
          ) : (
            <>
              <label className="pharmacy-stock__import-check">
                <input
                  type="checkbox"
                  checked={imp.useFinalSums}
                  onChange={(e) => imp.setUseFinalSums(e.target.checked)}
                />
                {t('pharmacyStock.importUseFinalSums')}
              </label>
              <button
                type="button"
                className="pharmacy-stock__import-btn pharmacy-stock__import-btn--go"
                onClick={imp.continueMatch}
                disabled={imp.busy}
              >
                {t('pharmacyStock.importContinue')}
              </button>
              <button
                type="button"
                className="pharmacy-stock__import-btn pharmacy-stock__import-btn--stop"
                onClick={imp.close}
                disabled={imp.busy}
              >
                {t('common.cancel')}
              </button>
            </>
          )}
        </div>
      </header>

      {imp.invoiceAlreadyImported ? (
        <p className="pharmacy-stock__import-warn">
          {t('pharmacyStock.importInvoiceAlreadyImported', { id: imp.invoiceId })}
        </p>
      ) : null}

      {matchStep ? (
        <PharmacyReceiptImportMatchBar
          t={t}
          items={imp.matchAllItems || imp.items}
          filter={imp.matchFilter}
          onFilter={imp.setMatchFilter}
          onSelectFound={imp.selectFound}
          onSelectAll={imp.selectAll}
          onClear={imp.clearSelected}
        />
      ) : (
        <PharmacyReceiptImportRolePreview
          t={t}
          roles={imp.roles}
          rows={imp.parse?.rows}
        />
      )}

      <div className="pharmacy-stock__import-body">
        {matchStep ? <PharmacyReceiptImportMatchTable t={t} imp={imp} /> : <ColumnsStep t={t} imp={imp} />}
        {imp.busy ? <div className="pharmacy-stock__import-busy">{t('pharmacyStock.importBusy')}</div> : null}
      </div>
    </div>
  );
}

function ColumnsStep({ t, imp }) {
  const columns = imp.parse?.columns ?? [];
  const rows = imp.parse?.rows ?? [];
  return (
    <div className="pharmacy-stock__import-table-wrap">
      <table className="pharmacy-stock__import-table">
        <thead>
          <tr>
            {columns.map((col) => {
              const role = imp.roles[col.index] || 'SKIP';
              const mapped = role !== 'SKIP';
              return (
                <th
                  key={`map-${col.index}`}
                  className={mapped ? 'pharmacy-stock__import-col is-mapped' : 'pharmacy-stock__import-col'}
                >
                  <select
                    className="pharmacy-stock__import-role"
                    value={role}
                    onChange={(e) => imp.setRole(col.index, e.target.value)}
                  >
                    {imp.roleKeys.map((key) => (
                      <option key={key} value={key}>{t(`pharmacyStock.importRole.${key}`)}</option>
                    ))}
                  </select>
                </th>
              );
            })}
          </tr>
          <tr className="pharmacy-stock__import-src">
            {columns.map((col) => {
              const role = imp.roles[col.index] || 'SKIP';
              return (
                <th
                  key={`src-${col.index}`}
                  className={role !== 'SKIP' ? 'is-mapped' : undefined}
                >
                  <span className="pharmacy-stock__import-src-idx">#{col.index + 1}</span>
                  {' '}
                  {col.header || col.title || '—'}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => {
                const role = imp.roles[col.index] || 'SKIP';
                return (
                  <td
                    key={col.index}
                    className={role !== 'SKIP' ? 'is-mapped' : undefined}
                  >
                    {row[col.index] || ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
