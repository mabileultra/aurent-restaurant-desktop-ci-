import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFiscalDriveSettings } from '../hooks/useFiscalDriveSettings';
import '../../../styles/cash-registers/multikassa-settings.css';

export default function FiscalDriveSettingsModal({ open, cashRegisterId, onClose }) {
  const p = useFiscalDriveSettings({ cashRegisterId, open, onSaved: onClose });

  if (!open || !cashRegisterId || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fiscal-drive-settings-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 id="fiscal-drive-settings-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {p.t('cashRegisters.fiscalDrive.title')}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={p.submit} className="overflow-y-auto px-5 py-4">
          {p.isLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">{p.t('common.loading')}</p>
          ) : (
            <div className="multikassa-settings">
              <p className="multikassa-settings__hint">{p.t('cashRegisters.fiscalDrive.hint')}</p>

              <div className="multikassa-settings__row">
                <span className="multikassa-settings__label">{p.t('cashRegisters.fiscalDrive.baseUrl')}</span>
                <input
                  className="multikassa-settings__input"
                  value={p.form.baseUrl}
                  onChange={(e) => p.updateField('baseUrl', e.target.value)}
                  required
                />
              </div>

              <div className="multikassa-settings__row">
                <span className="multikassa-settings__label">{p.t('cashRegisters.fiscalDrive.factoryId')}</span>
                {p.factoryIds.length > 1 ? (
                  <select
                    className="multikassa-settings__select"
                    value={p.form.factoryId}
                    onChange={(e) => p.updateField('factoryId', e.target.value)}
                  >
                    <option value="">{p.t('cashRegisters.fiscalDrive.factoryIdPlaceholder')}</option>
                    {p.factoryIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="multikassa-settings__input"
                    value={p.form.factoryId}
                    onChange={(e) => p.updateField('factoryId', e.target.value)}
                    placeholder={p.t('cashRegisters.fiscalDrive.factoryIdPlaceholder')}
                  />
                )}
                <div className="multikassa-settings__presets">
                  <button
                    type="button"
                    className="multikassa-settings__preset"
                    onClick={p.findDrives}
                    disabled={p.searching || p.checking}
                  >
                    {p.searching ? p.t('cashRegisters.fiscalDrive.searching') : p.t('cashRegisters.fiscalDrive.find')}
                  </button>
                  <button
                    type="button"
                    className="multikassa-settings__preset"
                    onClick={p.checkDrive}
                    disabled={p.searching || p.checking}
                  >
                    {p.checking ? p.t('cashRegisters.fiscalDrive.checking') : p.t('cashRegisters.fiscalDrive.check')}
                  </button>
                </div>
                {p.statusMessage ? (
                  <p className="multikassa-settings__test" style={{ marginTop: 8 }}>
                    {p.statusMessage}
                  </p>
                ) : (
                  <p className="multikassa-settings__hint" style={{ marginTop: 8 }}>
                    {p.t('cashRegisters.fiscalDrive.findHint')}
                  </p>
                )}
              </div>

              <div className="multikassa-settings__row">
                <span className="multikassa-settings__label">{p.t('cashRegisters.fiscalDrive.terminalId')}</span>
                <input
                  className="multikassa-settings__input"
                  value={p.form.terminalId}
                  onChange={(e) => p.updateField('terminalId', e.target.value)}
                />
              </div>

              <div className="multikassa-settings__row">
                <span className="multikassa-settings__label">{p.t('cashRegisters.fiscalDrive.ownerTin')}</span>
                <input
                  className="multikassa-settings__input"
                  value={p.form.ownerTin}
                  inputMode="numeric"
                  maxLength={14}
                  onChange={(e) => p.updateField('ownerTin', e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <label className="multikassa-settings__check">
                <input
                  type="checkbox"
                  checked={p.form.useForFiscalization}
                  onChange={(e) => p.updateField('useForFiscalization', e.target.checked)}
                />
                {p.t('cashRegisters.fiscalDrive.useForFiscalization')}
              </label>
              <p className="multikassa-settings__hint">{p.t('cashRegisters.fiscalDrive.useForFiscalizationHint')}</p>

              {p.statusMessage ? <p className="multikassa-settings__test">{p.statusMessage}</p> : null}

              <div className="multikassa-settings__actions">
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
