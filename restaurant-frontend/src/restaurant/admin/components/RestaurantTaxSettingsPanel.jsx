import toast from 'react-hot-toast';
import { BaseButton, BaseInput } from '../../../components/ui';
import { useRestaurantMultikassaSettings } from '../hooks/useRestaurantMultikassaSettings';
import '../styles/integrations-admin.css';

export default function RestaurantTaxSettingsPanel({
  cashRegisterId,
  registers,
  registersLoading,
  onSelectRegister,
  t,
}) {
  const p = useRestaurantMultikassaSettings({
    cashRegisterId,
    open: cashRegisterId != null,
  });

  return (
    <section className="rst-int-panel">
      <header className="rst-int-panel__head">
        <div>
          <h2 className="rst-int-panel__title">{t('rst.integrations.taxTitle')}</h2>
          <p className="rst-int-panel__sub">{t('rst.integrations.taxLead')}</p>
        </div>
      </header>

      <label className="rst-admin-field rst-admin-field--full mb-3">
        <span className="rst-admin-field__label">{t('rst.integrations.selectRegister')}</span>
        <select
          className="form-select"
          value={cashRegisterId ?? ''}
          onChange={(e) => onSelectRegister(e.target.value)}
          disabled={registersLoading}
        >
          <option value="">{t('rst.integrations.selectRegister')}</option>
          {registers.map((row) => (
            <option key={row.id} value={row.id}>
              {t('rst.integrations.registerOption', {
                number: row.registerNumber,
                model: row.equipmentModel || row.workstationName || row.equipmentSerial || row.id,
              })}
            </option>
          ))}
        </select>
      </label>

      {!cashRegisterId ? (
        <div className="rst-notice">
          {registersLoading
            ? t('common.loading')
            : registers.length === 0
              ? t('rst.integrations.noRegisters')
              : t('rst.integrations.selectRegister')}
        </div>
      ) : p.isLoading ? (
        <div className="rst-empty">{t('common.loading')}</div>
      ) : (
        <form className="rst-int-form" onSubmit={p.submit}>
          <p className="rst-int-form__hint">{t('cashRegisters.multikassa.hint')}</p>

          <label className="rst-admin-check">
            <input
              type="checkbox"
              checked={p.form.enabled}
              onChange={(e) => p.updateField('enabled', e.target.checked)}
            />
            <span>{t('cashRegisters.multikassa.enabled')}</span>
          </label>

          <BaseInput
            label={t('cashRegisters.multikassa.baseUrl')}
            value={p.form.baseUrl}
            onChange={(e) => p.updateField('baseUrl', e.target.value)}
            required
          />
          <div className="rst-int-presets">
            {['local8080', 'local12346', 'cloudV3', 'cloudV4'].map((key) => (
              <button
                key={key}
                type="button"
                className="rst-int-preset"
                onClick={() => p.applyPreset(key)}
              >
                {key === 'local8080' && 'localhost:8080'}
                {key === 'local12346' && 'localhost:12346'}
                {key === 'cloudV3' && 'v3.mkfiscal.uz'}
                {key === 'cloudV4' && 'v4.mkfiscal.uz'}
              </button>
            ))}
          </div>

          <BaseInput
            label={t('cashRegisters.multikassa.terminalId')}
            value={p.form.terminalId}
            onChange={(e) => p.updateField('terminalId', e.target.value)}
          />
          <BaseInput
            label={t('cashRegisters.multikassa.moduleNumber')}
            value={p.form.moduleNumber}
            onChange={(e) => p.updateField('moduleNumber', e.target.value)}
          />

          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{t('cashRegisters.multikassa.selectedDriveId')}</span>
            {p.drives.length > 0 ? (
              <select
                className="form-select"
                value={p.form.selectedDriveId}
                onChange={(e) => p.onSelectDrive(e.target.value)}
                disabled={p.loadingDrives || p.selectingDrive}
              >
                <option value="">{t('cashRegisters.multikassa.drivePlaceholder')}</option>
                {p.drives.map((drive) => (
                  <option key={drive.key} value={drive.id}>{drive.label}</option>
                ))}
              </select>
            ) : (
              <BaseInput
                value={p.form.selectedDriveId}
                onChange={(e) => p.updateField('selectedDriveId', e.target.value)}
                placeholder={t('cashRegisters.multikassa.driveManualPlaceholder')}
              />
            )}
          </label>

          <div className="rst-int-presets">
            <button
              type="button"
              className="rst-int-preset"
              onClick={() =>
                p.loadDrives(undefined, { notifyEmpty: true }).catch((e) =>
                  toast.error(e?.message || t('cashRegisters.multikassa.drivesLoadFailed')),
                )
              }
              disabled={p.loadingDrives}
            >
              {p.loadingDrives
                ? t('cashRegisters.multikassa.drivesLoading')
                : t('cashRegisters.multikassa.refreshDrives')}
            </button>
            {p.drives.length === 0 ? (
              <button
                type="button"
                className="rst-int-preset"
                onClick={p.applyModuleSerialAsDrive}
                disabled={!String(p.form.moduleNumber || '').trim()}
              >
                {t('cashRegisters.multikassa.useModuleAsDrive')}
              </button>
            ) : null}
          </div>

          <BaseInput
            label={t('cashRegisters.multikassa.cashierName')}
            value={p.form.cashierNameOverride}
            onChange={(e) => p.updateField('cashierNameOverride', e.target.value)}
          />

          <label className="rst-admin-check">
            <input
              type="checkbox"
              checked={p.form.printFiscalQr}
              onChange={(e) => p.updateField('printFiscalQr', e.target.checked)}
            />
            <span>{t('cashRegisters.multikassa.printFiscalQr')}</span>
          </label>
          <p className="rst-int-form__hint">{t('cashRegisters.multikassa.printFiscalQrHint')}</p>

          <label className="rst-admin-check">
            <input
              type="checkbox"
              checked={p.form.requireBeforeSale}
              onChange={(e) => p.updateField('requireBeforeSale', e.target.checked)}
            />
            <span>{t('cashRegisters.multikassa.requireBeforeSale')}</span>
          </label>
          <p className="rst-int-form__hint">{t('cashRegisters.multikassa.requireBeforeSaleHint')}</p>

          <p className="rst-int-form__hint">{t('rst.integrations.taxReceiptHint')}</p>

          {p.printersNote ? <p className="rst-int-form__test">{p.printersNote}</p> : null}
          {p.testMessage ? <p className="rst-int-form__test">{p.testMessage}</p> : null}

          <div className="rst-int-form__actions">
            <BaseButton
              type="button"
              variant="ghost"
              onClick={p.testConnection}
              disabled={p.testing || p.saving}
            >
              {p.testing ? t('cashRegisters.multikassa.testing') : t('cashRegisters.multikassa.test')}
            </BaseButton>
            <BaseButton type="button" variant="ghost" onClick={p.checkMkPrinters} disabled={p.loadingPrinters}>
              {p.loadingPrinters
                ? t('cashRegisters.multikassa.printersLoading')
                : t('cashRegisters.multikassa.refreshPrinters')}
            </BaseButton>
            <BaseButton type="submit" disabled={p.saving}>
              {p.saving ? t('common.saving') : t('common.save')}
            </BaseButton>
          </div>
        </form>
      )}
    </section>
  );
}
