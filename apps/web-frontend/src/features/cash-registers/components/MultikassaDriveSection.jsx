import toast from 'react-hot-toast';

export default function MultikassaDriveSection({ p }) {
  return (
    <>
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
    </>
  );
}
