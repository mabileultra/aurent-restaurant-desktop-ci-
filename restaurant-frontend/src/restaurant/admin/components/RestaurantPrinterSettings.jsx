import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BaseButton, BaseSelect } from '../../../components/ui';
import {
  getDesktopPrinterSettings,
  isDesktopPrinter,
  listDesktopPrinters,
  printTicketLines,
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
    <BaseSelect
      searchable={false}
      value={value || ''}
      disabled={disabled}
      placeholder={noneLabel}
      onChange={(e) => onChange(e.target.value)}
      options={[
        { value: '', label: noneLabel },
        ...names.map((name) => ({ value: name, label: name })),
      ]}
    />
  );
}

/** Printers attached to this desktop: cashier receipt, guest bill, each kitchen station. */
export default function RestaurantPrinterSettings({ stations, kitchenBoardEnabled = true, t }) {
  const desktop = isDesktopPrinter();
  const canList = desktop && typeof window.desktopCashier?.listPrinters === 'function';
  const [printers, setPrinters] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState('');

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

  const testPrint = async (printerName, key) => {
    const name = String(printerName || '').trim();
    if (!name) {
      toast.error(t('rst.admin.printersTestPick'));
      return;
    }
    setTesting(key);
    try {
      await printTicketLines({
        title: t('rst.admin.printersTest'),
        lines: [
          t('rst.admin.printersTestOk'),
          name,
          new Date().toLocaleString(),
        ],
        printerName: name,
      });
      toast.success(t('rst.admin.printersTestOk'));
    } catch {
      toast.error(t('rst.admin.printersTestFailed'));
    } finally {
      setTesting('');
    }
  };

  if (!desktop) {
    return (
      <div className="rst-printers-desktop-only">
        <p className="rst-coming__text">{t('rst.admin.printersDesktopOnly')}</p>
        <p className="rst-coming__text mb-0">{t('rst.admin.printersDesktopOnlySteps')}</p>
      </div>
    );
  }
  if (!canList) {
    return <p className="rst-coming__text">{t('rst.admin.printersNeedUpdate')}</p>;
  }
  if (!settings) {
    return <p className="rst-coming__text">{t('common.loading')}</p>;
  }

  const none = t('rst.admin.printerNone');
  const busy = saving || Boolean(testing);

  return (
    <div className="rst-admin-form">
      {loadError ? <p className="rst-coming__text">{t('rst.admin.printersLoadFailed')}</p> : null}
      <section className="rst-printers__block">
        <h2 className="rst-printers__title">{t('rst.admin.printersPayTitle')}</h2>
        <p className="rst-printers__note">{t('rst.admin.printersPayHint')}</p>
        <div className="rst-admin-form__grid rst-admin-form__grid--printers">
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{t('rst.admin.receiptPrinter')}</span>
            <div className="rst-printers__row">
              <PrinterSelect
                value={settings.receiptPrinterName}
                printers={printers}
                disabled={busy}
                noneLabel={none}
                onChange={(value) => save({ ...settings, receiptPrinterName: value })}
              />
              <BaseButton
                type="button"
                variant="ghost"
                disabled={busy || !settings.receiptPrinterName}
                onClick={() => testPrint(settings.receiptPrinterName, 'receipt')}
              >
                {testing === 'receipt' ? t('common.loading') : t('rst.admin.printersTest')}
              </BaseButton>
            </div>
            <span className="rst-admin-field__hint">{t('rst.admin.receiptPrinterHint')}</span>
          </label>
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{t('rst.admin.billPrinter')}</span>
            <div className="rst-printers__row">
              <PrinterSelect
                value={settings.billPrinterName}
                printers={printers}
                disabled={busy}
                noneLabel={none}
                onChange={(value) => save({ ...settings, billPrinterName: value })}
              />
              <BaseButton
                type="button"
                variant="ghost"
                disabled={busy || !settings.billPrinterName}
                onClick={() => testPrint(settings.billPrinterName, 'bill')}
              >
                {testing === 'bill' ? t('common.loading') : t('rst.admin.printersTest')}
              </BaseButton>
            </div>
            <span className="rst-admin-field__hint">{t('rst.admin.billPrinterHint')}</span>
          </label>
        </div>
      </section>
      <section className={`rst-printers__block${kitchenBoardEnabled ? '' : ' is-off'}`}>
        <h2 className="rst-printers__title">{t('rst.admin.printersKitchenTitle')}</h2>
        <p className="rst-printers__note">
          {kitchenBoardEnabled ? t('rst.admin.printersKitchenOn') : t('rst.admin.printersKitchenOff')}
        </p>
        <div className="rst-admin-form__grid rst-admin-form__grid--printers">
          {(stations || []).map((station) => {
            const value = settings.stationPrinters?.[station.id] || '';
            const testKey = `station:${station.id}`;
            return (
              <label key={station.id} className="rst-admin-field">
                <span className="rst-admin-field__label">{station.name}</span>
                <div className="rst-printers__row">
                  <PrinterSelect
                    value={value}
                    printers={printers}
                    disabled={busy}
                    noneLabel={none}
                    onChange={(next) => {
                      const stationPrinters = { ...(settings.stationPrinters || {}) };
                      if (next) stationPrinters[station.id] = next;
                      else delete stationPrinters[station.id];
                      save({ ...settings, stationPrinters });
                    }}
                  />
                  <BaseButton
                    type="button"
                    variant="ghost"
                    disabled={busy || !value}
                    onClick={() => testPrint(value, testKey)}
                  >
                    {testing === testKey ? t('common.loading') : t('rst.admin.printersTest')}
                  </BaseButton>
                </div>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
