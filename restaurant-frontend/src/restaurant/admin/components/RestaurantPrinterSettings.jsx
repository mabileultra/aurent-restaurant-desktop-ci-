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
import {
  isRestaurantLocalFirstDesktop,
  isRestaurantOfflineBridge,
  rstOfflineGetStatus,
  rstOfflineResolvePrintJob,
} from '../../../services/offline/restaurantOfflineBridge';
import { openActivityLogFolder, openActivityLogViewer } from '../../../services/desktop/activityLog';

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

function LocalFirstLogPanel({ t }) {
  const enabled = isRestaurantLocalFirstDesktop();
  const bridge = isRestaurantOfflineBridge();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (!bridge) {
      setStatus(null);
      return;
    }
    setBusy(true);
    try {
      setStatus(await rstOfflineGetStatus());
    } catch {
      setStatus(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void refresh();
    if (!bridge) return undefined;
    const timer = window.setInterval(() => {
      void refresh();
    }, 8_000);
    return () => window.clearInterval(timer);
  }, [bridge]);

  const openJournal = async () => {
    const res = await openActivityLogViewer();
    if (res?.ok === false) {
      toast.error(t('rst.admin.localFirstOpenLogFailed'));
    }
  };

  const openFolder = async () => {
    const res = await openActivityLogFolder();
    if (res?.ok === false) {
      toast.error(t('rst.admin.localFirstOpenLogFailed'));
    }
  };

  const resolveJob = async (jobId, action) => {
    setBusy(true);
    try {
      await rstOfflineResolvePrintJob({ jobId, action });
      toast.success(t('rst.admin.localFirstResolveOk'));
      setStatus(await rstOfflineGetStatus());
    } catch {
      toast.error(t('rst.admin.localFirstResolveFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rst-printers__block">
      <h2 className="rst-printers__title">{t('rst.admin.localFirstTitle')}</h2>
      <p className="rst-printers__note">{t('rst.admin.localFirstHint')}</p>
      {!enabled ? (
        <>
          <p className="rst-coming__text">{t('rst.admin.localFirstOff')}</p>
          {typeof window.desktopCashier?.setRestaurantLocalFirst === 'function' ? (
            <BaseButton
              type="button"
              onClick={async () => {
                try {
                  await window.desktopCashier.setRestaurantLocalFirst(true);
                  toast.success(t('rst.admin.localFirstEnabled'));
                } catch {
                  toast.error(t('rst.admin.localFirstEnableFailed'));
                }
              }}
            >
              {t('rst.admin.localFirstEnable')}
            </BaseButton>
          ) : null}
        </>
      ) : !bridge ? (
        <p className="rst-coming__text mb-0">{t('rst.admin.localFirstNeedUpdate')}</p>
      ) : (
        <>
          <div className="rst-admin-form__grid rst-admin-form__grid--printers">
            <div className="rst-admin-field">
              <span className="rst-admin-field__label">{t('rst.admin.localFirstRuntime')}</span>
              <span className="rst-admin-field__hint">
                {status?.runtimeStarted
                  ? t('rst.admin.localFirstRuntimeOn')
                  : t('rst.admin.localFirstRuntimeOff')}
              </span>
            </div>
            <div className="rst-admin-field">
              <span className="rst-admin-field__label">{t('rst.admin.localFirstBootstrap')}</span>
              <span className="rst-admin-field__hint">
                {status?.bootstrapReady
                  ? t('rst.admin.localFirstBootstrapOk', {
                      menu: status.menuItemCount ?? 0,
                      tables: status.tableCount ?? 0,
                    })
                  : t('rst.admin.localFirstBootstrapWait')}
              </span>
            </div>
            <div className="rst-admin-field">
              <span className="rst-admin-field__label">{t('rst.admin.localFirstQueues')}</span>
              <span className="rst-admin-field__hint">
                {t('rst.admin.localFirstQueuesValue', {
                  print: status?.pendingPrintJobs ?? 0,
                  unknown: status?.unknownPrintJobs ?? 0,
                  outbox: status?.pendingOutbox ?? 0,
                })}
              </span>
            </div>
            <div className="rst-admin-field">
              <span className="rst-admin-field__label">{t('rst.admin.localFirstSession')}</span>
              <span className="rst-admin-field__hint">
                {status?.hasAuthSession
                  ? t('rst.admin.localFirstSessionOn')
                  : t('rst.admin.localFirstSessionOff')}
                {status?.deviceId ? ` · ${status.deviceId}` : ''}
              </span>
            </div>
          </div>
          {(status?.unresolvedPrintJobs || []).length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <p className="rst-printers__note">{t('rst.admin.localFirstUnknownHint')}</p>
              {(status.unresolvedPrintJobs || []).map((job) => (
                <div key={job.id} className="rst-admin-field" style={{ marginBottom: 10 }}>
                  <span className="rst-admin-field__label">
                    {job.status} · {job.printerName || '—'} · {job.kind || 'ticket'}
                  </span>
                  <span className="rst-admin-field__hint">
                    {job.orderId ? `order ${job.orderId}` : job.id}
                    {job.lastError ? ` · ${job.lastError}` : ''}
                  </span>
                  <div className="rst-printers__row" style={{ marginTop: 6, gap: 8, flexWrap: 'wrap' }}>
                    {job.status === 'UNKNOWN' ? (
                      <>
                        <BaseButton
                          type="button"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void resolveJob(job.id, 'ACK_PRINTED')}
                        >
                          {t('rst.admin.localFirstAckPrinted')}
                        </BaseButton>
                        <BaseButton
                          type="button"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void resolveJob(job.id, 'MARK_FAILED')}
                        >
                          {t('rst.admin.localFirstMarkFailed')}
                        </BaseButton>
                      </>
                    ) : null}
                    <BaseButton
                      type="button"
                      disabled={busy}
                      onClick={() => void resolveJob(job.id, 'REQUEUE')}
                    >
                      {t('rst.admin.localFirstRequeue')}
                    </BaseButton>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <div className="rst-printers__row" style={{ marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
            <BaseButton type="button" variant="ghost" disabled={busy} onClick={() => void refresh()}>
              {busy ? t('common.loading') : t('rst.admin.localFirstRefresh')}
            </BaseButton>
            <BaseButton type="button" onClick={() => void openJournal()}>
              {t('rst.admin.localFirstOpenLog')}
            </BaseButton>
            <BaseButton type="button" variant="ghost" onClick={() => void openFolder()}>
              {t('rst.admin.localFirstOpenFolder')}
            </BaseButton>
          </div>
        </>
      )}
    </section>
  );
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
  const canList = desktop && typeof window.desktopCashier?.listPrinters === 'function';
  const [printers, setPrinters] = useState([]);
  const [settings, setSettings] = useState(null);
  const settingsRef = useRef(null);
  const [categoryPrinters, setCategoryPrinters] = useState({});
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
        const next = {
          receiptPrinterName: saved?.receiptPrinterName || '',
          labelPrinterName: saved?.labelPrinterName || '',
          billPrinterName: saved?.billPrinterName || '',
          stationPrinters: saved?.stationPrinters || {},
        };
        settingsRef.current = next;
        setSettings(next);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        const next = {
          receiptPrinterName: '',
          labelPrinterName: '',
          billPrinterName: '',
          stationPrinters: {},
        };
        settingsRef.current = next;
        setSettings(next);
      });
    return () => {
      cancelled = true;
    };
  }, [canList]);

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
        <LocalFirstLogPanel t={t} />
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
      <LocalFirstLogPanel t={t} />
    </div>
  );
}
