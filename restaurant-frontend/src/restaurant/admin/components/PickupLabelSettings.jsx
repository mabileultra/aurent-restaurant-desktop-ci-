import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { BaseButton, BaseSelect } from '../../../components/ui';
import {
  getDesktopPrinterSettings,
  isDesktopPrinter,
  listDesktopPrinters,
  saveDesktopPrinterSettings,
} from '../../pos/utils/desktopPrinters';
import { printPickupLabel } from '../../pos/utils/printPickupLabel';
import '../styles/pickup-label-settings.css';

function printerOptions(printers, current) {
  const names = printers.map((item) => item?.name).filter(Boolean);
  if (current && !names.includes(current)) names.unshift(current);
  return names;
}

export default function PickupLabelSettings({ t }) {
  const desktop = isDesktopPrinter();
  const canList = desktop && (
    typeof window.desktopCashier?.listPrinters === 'function'
    || typeof window.aurentRestaurant?.listPrinters === 'function'
  );
  const [printers, setPrinters] = useState([]);
  const [settings, setSettings] = useState(null);
  const settingsRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!canList) return undefined;
    let cancelled = false;
    Promise.all([listDesktopPrinters(), getDesktopPrinterSettings()])
      .then(([list, saved]) => {
        if (cancelled) return;
        setPrinters(Array.isArray(list) ? list : []);
        const next = saved || {};
        settingsRef.current = next;
        setSettings(next);
      })
      .catch(() => {
        if (!cancelled) setSettings({});
      });
    return () => { cancelled = true; };
  }, [canList]);

  const save = async (patch) => {
    const next = { ...(settingsRef.current || {}), ...patch };
    settingsRef.current = next;
    setSettings(next);
    setSaving(true);
    try {
      const saved = await saveDesktopPrinterSettings(next);
      settingsRef.current = saved;
      setSettings(saved);
      toast.success(t('rst.admin.printersSaved'));
    } catch {
      toast.error(t('rst.admin.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const testPrint = async () => {
    const name = String(settings?.labelPrinterName || '').trim();
    if (!name) {
      toast.error(t('rst.admin.printersTestPick'));
      return;
    }
    setTesting(true);
    try {
      await printPickupLabel({
        pickupNo: t('rst.admin.labelPrinterTestTitle', { defaultValue: 'ТЕСТ' }),
        channel: 'TAKEAWAY',
        items: [{ name: t('rst.admin.printersTestOk'), quantity: 1 }],
        printedAt: new Date().toISOString(),
        printerName: name,
        t,
      });
      toast.success(t('rst.admin.printersTestOk'));
    } catch {
      toast.error(t('rst.admin.printersTestFailed'));
    } finally {
      setTesting(false);
    }
  };

  if (!desktop) {
    return <p className="rst-printers__note">{t('rst.admin.printersDesktopOnly')}</p>;
  }

  const names = printerOptions(printers, settings?.labelPrinterName);
  const none = t('rst.admin.printerNone');
  const busy = saving || testing;

  return (
    <section className="rst-printers__block pickup-label-settings">
      <h2 className="rst-printers__title">{t('rst.admin.pickupLabelsPrinterTitle')}</h2>
      <p className="rst-printers__note">{t('rst.admin.pickupLabelsPrinterHint')}</p>
      <div className="rst-admin-field">
        <span className="rst-admin-field__label">{t('rst.admin.labelPrinter')}</span>
        <div className="rst-printers__row">
          <BaseSelect
            searchable={false}
            value={settings?.labelPrinterName || ''}
            disabled={busy || !settings}
            placeholder={none}
            onChange={(e) => save({ labelPrinterName: e.target.value })}
            options={[
              { value: '', label: none },
              ...names.map((name) => ({ value: name, label: name })),
            ]}
          />
          <BaseButton type="button" variant="ghost" disabled={busy || !settings?.labelPrinterName} onClick={testPrint}>
            {testing ? t('common.loading') : t('rst.admin.printersTest')}
          </BaseButton>
        </div>
        <span className="rst-admin-field__hint">{t('rst.admin.labelPrinterHint')}</span>
        <BaseSelect
          searchable={false}
          value={settings?.labelPrinterMode === 'tspl' ? 'tspl' : 'driver'}
          disabled={busy || !settings}
          onChange={(e) => save({ labelPrinterMode: e.target.value === 'tspl' ? 'tspl' : 'driver' })}
          options={[
            { value: 'driver', label: t('rst.admin.labelPrinterDriver') },
            { value: 'tspl', label: t('rst.admin.labelPrinterTspl') },
          ]}
        />
        {settings?.labelPrinterMode === 'tspl' ? (
          <span className="rst-admin-field__hint">{t('rst.admin.labelPrinterTsplHint')}</span>
        ) : null}
      </div>
    </section>
  );
}
