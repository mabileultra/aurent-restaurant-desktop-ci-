import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getDesktopPrinterSettings,
  isDesktopPrinter,
  listDesktopPrinters,
  saveDesktopPrinterSettings,
} from '../../pos/utils/desktopPrinters';

function printerOptions(printers, current) {
  const names = printers.map((item) => item?.name).filter(Boolean);
  if (current && !names.includes(current)) names.unshift(current);
  return names;
}

function PrinterSelect({ value, printers, disabled, noneLabel, onChange }) {
  const names = printerOptions(printers, value);
  return (
    <select
      className="form-select"
      value={value || ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{noneLabel}</option>
      {names.map((name) => (
        <option key={name} value={name}>{name}</option>
      ))}
    </select>
  );
}

/** Printers attached to this desktop: cashier receipt, guest bill, each kitchen station. */
export default function RestaurantPrinterSettings({ stations, t }) {
  const desktop = isDesktopPrinter();
  const canList = desktop && typeof window.desktopCashier?.listPrinters === 'function';
  const [printers, setPrinters] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canList) return undefined;
    let cancelled = false;
    Promise.all([listDesktopPrinters(), getDesktopPrinterSettings()])
      .then(([list, saved]) => {
        if (cancelled) return;
        setPrinters(Array.isArray(list) ? list : []);
        setSettings({
          receiptPrinterName: saved?.receiptPrinterName || '',
          labelPrinterName: saved?.labelPrinterName || '',
          billPrinterName: saved?.billPrinterName || '',
          stationPrinters: saved?.stationPrinters || {},
        });
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        setSettings({
          receiptPrinterName: '',
          labelPrinterName: '',
          billPrinterName: '',
          stationPrinters: {},
        });
      });
    return () => {
      cancelled = true;
    };
  }, [canList]);

  const save = async (next) => {
    setSaving(true);
    try {
      const saved = await saveDesktopPrinterSettings(next);
      setSettings({
        receiptPrinterName: saved?.receiptPrinterName || '',
        labelPrinterName: saved?.labelPrinterName || '',
        billPrinterName: saved?.billPrinterName || '',
        stationPrinters: saved?.stationPrinters || {},
      });
      toast.success(t('rst.admin.printersSaved'));
    } catch {
      toast.error(t('rst.admin.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (!desktop) {
    return <p className="rst-coming__text">{t('rst.admin.printersDesktopOnly')}</p>;
  }
  if (!canList) {
    return <p className="rst-coming__text">{t('rst.admin.printersNeedUpdate')}</p>;
  }
  if (!settings) {
    return <p className="rst-coming__text">{t('common.loading')}</p>;
  }

  const none = t('rst.admin.printerNone');

  return (
    <div className="rst-admin-form">
      {loadError ? <p className="rst-coming__text">{t('rst.admin.printersLoadFailed')}</p> : null}
      <div className="rst-admin-form__grid rst-admin-form__grid--printers">
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{t('rst.admin.receiptPrinter')}</span>
          <PrinterSelect
            value={settings.receiptPrinterName}
            printers={printers}
            disabled={saving}
            noneLabel={none}
            onChange={(value) => save({ ...settings, receiptPrinterName: value })}
          />
          <span className="rst-admin-field__hint">{t('rst.admin.receiptPrinterHint')}</span>
        </label>
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{t('rst.admin.billPrinter')}</span>
          <PrinterSelect
            value={settings.billPrinterName}
            printers={printers}
            disabled={saving}
            noneLabel={none}
            onChange={(value) => save({ ...settings, billPrinterName: value })}
          />
          <span className="rst-admin-field__hint">{t('rst.admin.billPrinterHint')}</span>
        </label>
      </div>
      {(stations || []).map((station) => (
        <label key={station.id} className="rst-admin-field">
          <span className="rst-admin-field__label">{station.name}</span>
          <PrinterSelect
            value={settings.stationPrinters?.[station.id] || ''}
            printers={printers}
            disabled={saving}
            noneLabel={none}
            onChange={(value) => {
              const stationPrinters = { ...(settings.stationPrinters || {}) };
              if (value) stationPrinters[station.id] = value;
              else delete stationPrinters[station.id];
              save({ ...settings, stationPrinters });
            }}
          />
          <span className="rst-admin-field__hint">{t('rst.admin.stationPrinterHint')}</span>
        </label>
      ))}
    </div>
  );
}
