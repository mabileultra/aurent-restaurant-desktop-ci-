import { useCallback, useEffect, useState } from 'react';
import { Loader2, Radar, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';
import { isDesktopCashier } from '../utils/printReceipt';
import { ToggleSwitch } from './ShelfLabelPrintControls';

const DEFAULTS = { enabled: false, host: '', port: 9100, gapMm: 2 };

function isTsplApiAvailable() {
  return (
    isDesktopCashier() &&
    typeof window.desktopCashier?.labelTsplGetSettings === 'function' &&
    typeof window.desktopCashier?.labelTsplSetSettings === 'function'
  );
}

function sourceLabel(source, t) {
  if (source === 'windows_printer') {
    return t('usersBarcodePrint.tsplSourceWindows', { defaultValue: 'Windows-принтер' });
  }
  if (source === 'network_scan') {
    return t('usersBarcodePrint.tsplSourceScan', { defaultValue: 'Сеть' });
  }
  return t('usersBarcodePrint.tsplSourceUnknown', { defaultValue: 'Найдено' });
}

export default function LabelTsplSettingsPanel({ t }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const available = isTsplApiAvailable();

  useEffect(() => {
    if (!available) {
      setLoaded(true);
      return;
    }
    window.desktopCashier
      .labelTsplGetSettings()
      .then((s) => setSettings({ ...DEFAULTS, ...s }))
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [available]);

  const persist = useCallback(
    async (patch) => {
      if (!available) return;
      const next = { ...settings, ...patch };
      setSettings(next);
      try {
        const saved = await window.desktopCashier.labelTsplSetSettings(patch);
        setSettings({ ...DEFAULTS, ...saved });
      } catch {
        /* ignore */
      }
    },
    [available, settings],
  );

  const runAutoDetect = useCallback(
    async ({ save = false } = {}) => {
      if (!available || typeof window.desktopCashier?.labelTsplAutoDetect !== 'function') {
        toast.error(
          t('usersBarcodePrint.tsplDetectUnavailable', {
            defaultValue: 'Автопоиск доступен только в приложении Aurent (десктоп).',
          }),
        );
        return;
      }

      setScanning(true);
      try {
        const result = await window.desktopCashier.labelTsplAutoDetect({
          port: Number(settings.port) || 9100,
          save,
        });
        const list = Array.isArray(result?.candidates) ? result.candidates : [];
        setCandidates(list);

        if (result?.best?.host) {
          setSettings((s) => ({ ...s, host: result.best.host }));
          if (save) {
            await persist({ host: result.best.host });
          }
          toast.success(
            t('usersBarcodePrint.tsplDetectFound', {
              defaultValue: 'Найден принтер: {{host}}',
              host: result.best.host,
            }),
          );
        } else {
          toast.error(
            t('usersBarcodePrint.tsplDetectNotFound', {
              defaultValue:
                'Принтер не найден. Проверьте Wi‑Fi/Ethernet и что принтер в той же сети, что и ПК.',
            }),
          );
        }
      } catch (err) {
        toast.error(
          err?.message ||
            t('usersBarcodePrint.tsplDetectFailed', { defaultValue: 'Не удалось выполнить поиск.' }),
        );
      } finally {
        setScanning(false);
      }
    },
    [available, persist, settings.port, t],
  );

  const pickCandidate = useCallback(
    async (host) => {
      if (!host) return;
      setSettings((s) => ({ ...s, host }));
      await persist({ host });
      toast.success(
        t('usersBarcodePrint.tsplHostSaved', {
          defaultValue: 'IP сохранён: {{host}}',
          host,
        }),
      );
    },
    [persist, t],
  );

  if (!available || !loaded) return null;

  return (
    <section className="mt-4 rounded-card border border-line bg-canvas p-3">
      <h3 className="text-sm font-semibold text-ink">
        {t('usersBarcodePrint.tsplTitle', { defaultValue: 'TSPL — сетевой XP-365B' })}
      </h3>
      <p className="mt-1 text-xs text-ink-muted">
        {t('usersBarcodePrint.tsplHint', {
          defaultValue:
            'Прямая печать этикеток по TSPL (порт 9100). Не влияет на чеки и другие принтеры.',
        })}
      </p>

      <div className="mt-3 space-y-3">
        <ToggleSwitch
          label={t('usersBarcodePrint.tsplEnabled', { defaultValue: 'Печать через TSPL' })}
          checked={Boolean(settings.enabled)}
          onChange={(enabled) => persist({ enabled })}
        />

        {settings.enabled ? (
          <>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="ui-label">
                  {t('usersBarcodePrint.tsplHost', { defaultValue: 'IP-адрес принтера' })}
                </label>
                <button
                  type="button"
                  disabled={scanning}
                  onClick={() => runAutoDetect({ save: true })}
                  className="ui-btn-secondary h-8 px-2.5 text-xs"
                >
                  {scanning ? <Loader2 size={14} className="animate-spin" /> : <Radar size={14} />}
                  {scanning
                    ? t('usersBarcodePrint.tsplDetecting', { defaultValue: 'Ищем…' })
                    : t('usersBarcodePrint.tsplDetect', { defaultValue: 'Найти автоматически' })}
                </button>
              </div>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="192.168.1.200"
                className="ui-input ui-tabular"
                value={settings.host || ''}
                onChange={(e) => setSettings((s) => ({ ...s, host: e.target.value }))}
                onBlur={() => persist({ host: settings.host || '' })}
              />
              <p className="text-[11px] leading-relaxed text-ink-muted">
                {t('usersBarcodePrint.tsplFindManualHint', {
                  defaultValue:
                    'Вручную: на XP-365B распечатайте self-test (удерживайте FEED 3 сек) — IP будет на этикетке. Или посмотрите в роутере список устройств.',
                })}
              </p>
            </div>

            {candidates.length > 0 ? (
              <div className="rounded-input border border-line bg-surface p-2">
                <p className="mb-2 flex items-center gap-1 text-[11px] font-medium text-ink-muted">
                  <Wifi size={12} aria-hidden />
                  {t('usersBarcodePrint.tsplCandidates', { defaultValue: 'Найденные устройства (порт 9100)' })}
                </p>
                <div className="flex flex-col gap-1.5">
                  {candidates.slice(0, 6).map((item) => (
                    <button
                      key={`${item.host}:${item.port}`}
                      type="button"
                      onClick={() => pickCandidate(item.host)}
                      className={`flex items-center justify-between rounded-input border px-2.5 py-1.5 text-left text-xs transition ${
                        settings.host === item.host
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-line hover:border-primary-300'
                      }`}
                    >
                      <span className="font-mono ui-tabular font-semibold text-ink">
                        {item.host}
                      </span>
                      <span className="text-ink-muted">{sourceLabel(item.source, t)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="ui-label">
                  {t('usersBarcodePrint.tsplPort', { defaultValue: 'Порт' })}
                </label>
                <input
                  type="number"
                  min={1}
                  max={65535}
                  className="ui-input ui-tabular"
                  value={settings.port ?? 9100}
                  onChange={(e) => setSettings((s) => ({ ...s, port: Number(e.target.value) || 9100 }))}
                  onBlur={() => persist({ port: Number(settings.port) || 9100 })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="ui-label">
                  {t('usersBarcodePrint.tsplGap', { defaultValue: 'GAP (мм)' })}
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  className="ui-input ui-tabular"
                  value={settings.gapMm ?? 2}
                  onChange={(e) => setSettings((s) => ({ ...s, gapMm: Number(e.target.value) || 2 }))}
                  onBlur={() => persist({ gapMm: Number(settings.gapMm) || 2 })}
                />
              </div>
            </div>

            <p className="rounded-input bg-surface border border-line px-2.5 py-1.5 text-xs text-ink-muted">
              {t('usersBarcodePrint.tsplCalibrationHint', {
                defaultValue:
                  'Калибровка GAP: выключите принтер → зажмите FEED → включите → держите, пока не протянет этикетки. Сдвиги — в блоке «Калибровка печати» ниже.',
              })}
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
