import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMultikassaSettings } from '../hooks/useMultikassaSettings';
import '../../../styles/cash-registers/multikassa-settings.css';

export default function MultikassaSettingsModal({ open, cashRegisterId, onClose }) {
  const p = useMultikassaSettings({ cashRegisterId, open, onSaved: onClose });

  if (!open || !cashRegisterId || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[11500] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-[#26332d]/30" aria-label="Close" onClick={onClose} />
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[#e4e7ec] bg-white font-[Inter,Segoe_UI,system-ui,sans-serif] text-[#1f2024] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="multikassa-settings-title"
      >
        <div className="flex items-center justify-between bg-[#134842] px-5 py-4 text-white">
          <h2 id="multikassa-settings-title" className="text-lg font-semibold text-white">
            {p.t('cashRegisters.multikassa.title')}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={p.submit} className="overflow-y-auto px-5 py-4">
          {p.isLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">{p.t('common.loading')}</p>
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
