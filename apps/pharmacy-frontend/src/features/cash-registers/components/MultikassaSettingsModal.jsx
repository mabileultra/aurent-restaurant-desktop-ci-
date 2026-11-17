import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMultikassaSettings } from '../hooks/useMultikassaSettings';
import '../../../styles/cash-registers/multikassa-settings.css';

export default function MultikassaSettingsModal({ open, cashRegisterId, onClose }) {
  const p = useMultikassaSettings({ cashRegisterId, open, onSaved: onClose });

  if (!open || !cashRegisterId || typeof document === 'undefined') return null;

  return createPortal(
    <div className="ui-modal-overlay z-[11500]">
      <button type="button" className="fixed inset-0 bg-ink/45" aria-label="Close" onClick={onClose} />
      <div
        className="ui-modal-panel relative max-w-lg max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="multikassa-settings-title"
      >
        <div className="ui-modal-header bg-primary-50">
          <h2 id="multikassa-settings-title" className="text-base font-semibold text-ink">
            {p.t('cashRegisters.multikassa.title')}
          </h2>
          <button type="button" onClick={onClose} className="ui-icon-btn" aria-label={p.t('common.close')}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={p.submit} className="ui-modal-body overflow-y-auto">
          {p.isLoading ? (
            <p className="py-8 text-center text-sm text-ink-muted">{p.t('common.loading')}</p>
          ) : (
            <div className="multikassa-settings">
              <p className="multikassa-settings__hint">{p.t('cashRegisters.multikassa.hint')}</p>

              <label className="multikassa-settings__check">
                <input
                  type="checkbox"
                  checked={p.form.enabled}
                  onChange={(e) => p.updateField('enabled', e.target.checked)}
                />
                {p.t('cashRegisters.multikassa.enabled')}
              </label>

              <div className="multikassa-settings__row">
                <span className="multikassa-settings__label">{p.t('cashRegisters.multikassa.baseUrl')}</span>
                <input
                  className="multikassa-settings__input"
                  value={p.form.baseUrl}
                  onChange={(e) => p.updateField('baseUrl', e.target.value)}
                  required
                />
                <div className="multikassa-settings__presets">
                  <button type="button" className="multikassa-settings__preset" onClick={() => p.applyPreset('local8080')}>
                    localhost:8080
                  </button>
                  <button type="button" className="multikassa-settings__preset" onClick={() => p.applyPreset('local12346')}>
                    localhost:12346
                  </button>
                  <button type="button" className="multikassa-settings__preset" onClick={() => p.applyPreset('cloudV3')}>
                    v3.mkfiscal.uz
                  </button>
                  <button type="button" className="multikassa-settings__preset" onClick={() => p.applyPreset('cloudV4')}>
                    v4.mkfiscal.uz
                  </button>
                </div>
              </div>

              <div className="multikassa-settings__row">
                <span className="multikassa-settings__label">{p.t('cashRegisters.multikassa.terminalId')}</span>
                <input
                  className="multikassa-settings__input"
                  value={p.form.terminalId}
                  onChange={(e) => p.updateField('terminalId', e.target.value)}
                />
              </div>

              <div className="multikassa-settings__row">
                <span className="multikassa-settings__label">{p.t('cashRegisters.multikassa.moduleNumber')}</span>
                <input
                  className="multikassa-settings__input"
                  value={p.form.moduleNumber}
                  onChange={(e) => p.updateField('moduleNumber', e.target.value)}
                />
              </div>

              <div className="multikassa-settings__row">
                <span className="multikassa-settings__label">{p.t('cashRegisters.multikassa.selectedDriveId')}</span>
                {p.drives.length > 0 ? (
                  <select
                    className="multikassa-settings__select"
                    value={p.form.selectedDriveId}
                    onChange={(e) => p.onSelectDrive(e.target.value)}
                    disabled={p.loadingDrives || p.selectingDrive}
                  >
                    <option value="">{p.t('cashRegisters.multikassa.drivePlaceholder')}</option>
                    {p.drives.map((drive) => (
                      <option key={drive.key} value={drive.id}>
                        {drive.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="multikassa-settings__input"
                    value={p.form.selectedDriveId}
                    onChange={(e) => p.updateField('selectedDriveId', e.target.value)}
                    placeholder={p.t('cashRegisters.multikassa.driveManualPlaceholder')}
                  />
                )}
                <button
                  type="button"
                  className="multikassa-settings__preset"
                  onClick={() =>
                    p
                      .loadDrives(undefined, { notifyEmpty: true })
                      .catch((e) => toast.error(e?.message || p.t('cashRegisters.multikassa.drivesLoadFailed')))
                  }
                  disabled={p.loadingDrives}
                >
                  {p.loadingDrives
                    ? p.t('cashRegisters.multikassa.drivesLoading')
                    : p.t('cashRegisters.multikassa.refreshDrives')}
                </button>
                {p.drives.length === 0 ? (
                  <button
                    type="button"
                    className="multikassa-settings__preset"
                    onClick={p.applyModuleSerialAsDrive}
                    disabled={!String(p.form.moduleNumber || '').trim()}
                  >
                    {p.t('cashRegisters.multikassa.useModuleAsDrive')}
                  </button>
                ) : null}
              </div>
              {p.drives.length === 0 ? (
                <p className="multikassa-settings__hint">{p.t('cashRegisters.multikassa.drivesEmptyHint')}</p>
              ) : null}

              <div className="multikassa-settings__row">
                <span className="multikassa-settings__label">{p.t('cashRegisters.multikassa.cashierName')}</span>
                <input
                  className="multikassa-settings__input"
                  value={p.form.cashierNameOverride}
                  onChange={(e) => p.updateField('cashierNameOverride', e.target.value)}
                />
              </div>

              <label className="multikassa-settings__check">
                <input
                  type="checkbox"
                  checked={p.form.printFiscalQr}
                  onChange={(e) => p.updateField('printFiscalQr', e.target.checked)}
                />
                {p.t('cashRegisters.multikassa.printFiscalQr')}
              </label>
              <p className="multikassa-settings__hint">{p.t('cashRegisters.multikassa.printFiscalQrHint')}</p>

              <label className="multikassa-settings__check">
                <input
                  type="checkbox"
                  checked={p.form.requireBeforeSale}
                  onChange={(e) => p.updateField('requireBeforeSale', e.target.checked)}
                />
                {p.t('cashRegisters.multikassa.requireBeforeSale')}
              </label>
              <p className="multikassa-settings__hint">{p.t('cashRegisters.multikassa.requireBeforeSaleHint')}</p>

              {!p.mkPrinterReady ? (
                <p className="multikassa-settings__hint">{p.t('cashRegisters.multikassa.mkPrinterHint')}</p>
              ) : null}
              <div className="multikassa-settings__row">
                <button
                  type="button"
                  className="multikassa-settings__preset"
                  onClick={p.checkMkPrinters}
                  disabled={p.loadingPrinters}
                >
                  {p.loadingPrinters
                    ? p.t('cashRegisters.multikassa.printersLoading')
                    : p.t('cashRegisters.multikassa.refreshPrinters')}
                </button>
              </div>
              {p.printersNote ? <p className="multikassa-settings__test">{p.printersNote}</p> : null}

              {p.testMessage ? <p className="multikassa-settings__test">{p.testMessage}</p> : null}

              <div className="multikassa-settings__actions">
                <button
                  type="button"
                  className="multikassa-settings__btn multikassa-settings__btn--secondary"
                  onClick={p.testConnection}
                  disabled={p.testing || p.saving}
                >
                  {p.testing ? p.t('cashRegisters.multikassa.testing') : p.t('cashRegisters.multikassa.test')}
                </button>
                <button
                  type="button"
                  className="multikassa-settings__btn multikassa-settings__btn--secondary"
                  onClick={onClose}
                >
                  {p.t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="multikassa-settings__btn multikassa-settings__btn--primary"
                  disabled={p.saving}
                >
                  {p.saving ? p.t('common.saving') : p.t('common.save')}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body,
  );
}
