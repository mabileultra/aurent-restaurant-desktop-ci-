import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { isDesktopCashier } from '../utils/printReceipt';
import { ToggleSwitch } from './ShelfLabelPrintControls';
import TsplHostInput from './TsplHostInput';
import TsplCandidatesList from './TsplCandidatesList';
import TsplPortGapInputs from './TsplPortGapInputs';

const DEFAULTS = { enabled: false, host: '', port: 9100, gapMm: 2 };

function isTsplApiAvailable() {
  return (
    isDesktopCashier() &&
    typeof window.desktopCashier?.labelTsplGetSettings === 'function' &&
    typeof window.desktopCashier?.labelTsplSetSettings === 'function'
  );
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
    <section className="mt-4 rounded-xl border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-900/50 dark:bg-violet-950/20">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {t('usersBarcodePrint.tsplTitle', { defaultValue: 'TSPL — сетевой XP-365B' })}
      </h3>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
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
            <TsplHostInput
              host={settings.host}
              scanning={scanning}
              onChange={(host) => setSettings((s) => ({ ...s, host }))}
              onBlur={() => persist({ host: settings.host || '' })}
              onAutoDetect={runAutoDetect}
              t={t}
            />

            <TsplCandidatesList
              candidates={candidates}
              selectedHost={settings.host}
              onPick={pickCandidate}
              t={t}
            />

            <TsplPortGapInputs
              settings={settings}
              onChange={setSettings}
              onPersist={persist}
              t={t}
            />

            <p className="rounded-md bg-white/70 px-2 py-1.5 text-xs text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
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
