import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BaseButton, BaseSelect } from '../../../components/ui';
import { rstMenuApi } from '../../api/menu.api';
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

function PrinterSelect({ value, printers, disabled, noneLabel, allowEmpty = true, onChange }) {
  const names = printerOptions(printers, value);
  return (
    <BaseSelect
      searchable={false}
      value={value || ''}
      disabled={disabled}
      placeholder={noneLabel}
      onChange={(e) => onChange(e.target.value)}
      options={[
        ...(allowEmpty ? [{ value: '', label: noneLabel }] : []),
        ...names.map((name) => ({ value: name, label: name })),
      ]}
    />
  );
}

/** Printers attached to this desktop: cashier receipt, guest bill, each kitchen station. */
function stationPrinter(settings, stationId) {
  const map = settings?.stationPrinters || {};
  return map[stationId] || map[String(stationId)] || '';
}

export default function RestaurantPrinterSettings({
  stations,
  categories = [],
  storeId,
  kitchenBoardEnabled = true,
  t,
}) {
  const qc = useQueryClient();
  const desktop = isDesktopPrinter();
  const canList = desktop && (
    typeof window.desktopCashier?.listPrinters === 'function'
    || typeof window.aurentRestaurant?.listPrinters === 'function'
  );
  const [printers, setPrinters] = useState([]);
  const [settings, setSettings] = useState(null);
  const settingsRef = useRef(null);
  const [categoryPrinters, setCategoryPrinters] = useState({});
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState('');

  const applySettings = (saved) => {
    const next = {
      receiptPrinterName: saved?.receiptPrinterName || '',
      labelPrinterName: saved?.labelPrinterName || '',
      billPrinterName: saved?.billPrinterName || '',
      stationPrinters: saved?.stationPrinters || {},
    };
    settingsRef.current = next;
    setSettings(next);
    return next;
  };

  const loadPrinters = () => {
    if (!canList) return Promise.resolve();
    setLoadError(false);
    return Promise.all([listDesktopPrinters(), getDesktopPrinterSettings()])
      .then(([list, saved]) => {
        setPrinters(Array.isArray(list) ? list : []);
        applySettings(saved);
      })
      .catch(() => {
        setLoadError(true);
        applySettings({
          receiptPrinterName: '',
          labelPrinterName: '',
          billPrinterName: '',
          stationPrinters: {},
        });
      });
  };

  useEffect(() => {
    if (!canList) return undefined;
    let cancelled = false;
    loadPrinters().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [canList]);

  const save = async (patch) => {
    const next = { ...(settingsRef.current || settings), ...patch };
    applySettings(next);
    setSaving(true);
    try {
      applySettings(await saveDesktopPrinterSettings(next));
      toast.success(t('rst.admin.printersSaved'));
    } catch {
      toast.error(t('rst.admin.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const shownCategoryPrinter = (category) => {
    const override = categoryPrinters[category.id];
    const saved = category.printPrinterName || '';
    if (override != null && override !== saved) return override;
    return saved;
  };

  const saveCategoryPrinter = async (category, printerName) => {
    const name = String(printerName || '').trim();
    if (!name) {
      toast.error(t('rst.admin.printersTestPick'));
      return;
    }
    setCategoryPrinters((prev) => ({ ...prev, [category.id]: name }));
    setSaving(true);
    try {
      await rstMenuApi.updateCategory(category.id, {
        name: category.name,
        sortOrder: category.sortOrder ?? 100,
        autoPrint: true,
        printPrinterName: name,
      });
      await qc.invalidateQueries({ queryKey: ['rst-menu-categories-admin', storeId] });
      await qc.invalidateQueries({ queryKey: ['rst-menu-categories', storeId] });
      toast.success(t('rst.admin.printersSaved'));
    } catch {
      setCategoryPrinters((prev) => {
        const next = { ...prev };
        delete next[category.id];
        return next;
      });
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

  const none = t('rst.admin.printerNone');
  const busy = saving || Boolean(testing);
  const categoryBlock = (
    <section className="rst-printers__block">
      <h2 className="rst-printers__title">{t('rst.admin.printersCategoriesTitle')}</h2>
      <p className="rst-printers__note">{t('rst.admin.printersCategoriesHint')}</p>
      {categories.length === 0 ? (
        <p className="rst-coming__text mb-0">{t('rst.admin.printersCategoriesEmpty')}</p>
      ) : (
        <div className="rst-admin-form__grid rst-admin-form__grid--printers">
          {categories.map((category) => {
            const value = shownCategoryPrinter(category);
            return (
              <div key={category.id} className="rst-admin-field">
                <span className="rst-admin-field__label">{category.name}</span>
                {canList ? (
                  <div className="rst-printers__row">
                    <PrinterSelect
                      value={value}
                      printers={printers}
                      disabled={busy}
                      noneLabel={none}
                      allowEmpty={false}
                      onChange={(next) => saveCategoryPrinter(category, next)}
                    />
                    <BaseButton
                      type="button"
                      variant="ghost"
                      disabled={busy || !value}
                      onClick={() => testPrint(value, `category:${category.id}`)}
                    >
                      {testing === `category:${category.id}` ? t('common.loading') : t('rst.admin.printersTest')}
                    </BaseButton>
                  </div>
                ) : (
                  <span className="rst-admin-field__hint">{value || '—'}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  if (!desktop || !canList || !settings) {
    return (
      <div className="rst-admin-form">
        {categoryBlock}
        {!desktop ? (
          <div className="rst-printers-desktop-only">
            <p className="rst-coming__text">{t('rst.admin.printersDesktopOnly')}</p>
            <p className="rst-coming__text mb-0">{t('rst.admin.printersDesktopOnlySteps')}</p>
          </div>
        ) : !canList ? (
          <p className="rst-coming__text">{t('rst.admin.printersNeedUpdate')}</p>
        ) : (
          <p className="rst-coming__text">{t('common.loading')}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rst-admin-form">
      {loadError ? <p className="rst-coming__text">{t('rst.admin.printersLoadFailed')}</p> : null}
      <div className="rst-printers__row" style={{ marginBottom: 12 }}>
        <BaseButton type="button" variant="ghost" disabled={busy} onClick={() => loadPrinters()}>
          {t('rst.admin.printersFind', { defaultValue: 'Найти принтеры' })}
        </BaseButton>
        <span className="rst-admin-field__hint">
          {printers.length
            ? t('rst.admin.printersFound', {
              count: printers.length,
              defaultValue: `Найдено: ${printers.length}`,
            })
            : t('rst.admin.printersNoneFound', { defaultValue: 'Windows пока не отдал список — нажмите «Найти принтеры».' })}
        </span>
      </div>
      <section className="rst-printers__block">
        <h2 className="rst-printers__title">{t('rst.admin.printersPayTitle')}</h2>
        <p className="rst-printers__note">{t('rst.admin.printersPayHint')}</p>
        <div className="rst-admin-form__grid rst-admin-form__grid--printers">
          <div className="rst-admin-field">
            <span className="rst-admin-field__label">{t('rst.admin.receiptPrinter')}</span>
            <div className="rst-printers__row">
              <PrinterSelect
                value={settings.receiptPrinterName}
                printers={printers}
                disabled={busy}
                noneLabel={none}
                onChange={(value) => save({ receiptPrinterName: value })}
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
          </div>
          <div className="rst-admin-field">
            <span className="rst-admin-field__label">{t('rst.admin.billPrinter')}</span>
            <div className="rst-printers__row">
              <PrinterSelect
                value={settings.billPrinterName}
                printers={printers}
                disabled={busy}
                noneLabel={none}
                onChange={(value) => save({ billPrinterName: value })}
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
          </div>
        </div>
      </section>
      <section className="rst-printers__block">
        <h2 className="rst-printers__title">{t('rst.admin.printersKitchenTitle')}</h2>
        <p className="rst-printers__note">
          {kitchenBoardEnabled ? t('rst.admin.printersKitchenOn') : t('rst.admin.printersKitchenOff')}
        </p>
        {kitchenBoardEnabled ? (
        <div className="rst-admin-form__grid rst-admin-form__grid--printers">
          {(stations || []).map((station) => {
            const value = stationPrinter(settings, station.id);
            const testKey = `station:${station.id}`;
            return (
              <div key={station.id} className="rst-admin-field">
                <span className="rst-admin-field__label">{station.name}</span>
                <div className="rst-printers__row">
                  <PrinterSelect
                    value={value}
                    printers={printers}
                    disabled={busy}
                    noneLabel={none}
                    onChange={(next) => {
                      const current = settingsRef.current || settings;
                      const stationPrinters = { ...(current.stationPrinters || {}) };
                      const key = String(station.id);
                      if (next) stationPrinters[key] = next;
                      else delete stationPrinters[key];
                      save({ stationPrinters });
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
              </div>
            );
          })}
        </div>
        ) : null}
      </section>
      {categoryBlock}
    </div>
  );
}
