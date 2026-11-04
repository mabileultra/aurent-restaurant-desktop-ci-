import { useEffect, useRef, useState } from 'react';

function absoluteInstallerUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (typeof window === 'undefined' || !window.location?.origin) return raw;
  return `${window.location.origin}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

function canAutoMigrate() {
  return Boolean(window.desktopCashier?.migrateToPharmacyDesktop);
}

/**
 * Auto-download + install Aurent Pharmacy from legacy grocery Electron.
 */
export function usePharmacyDesktopAutoMigrate({ open, manifest }) {
  const [phase, setPhase] = useState('idle');
  const [percent, setPercent] = useState(null);
  const [errorCode, setErrorCode] = useState('');
  const [attempt, setAttempt] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      setPhase('idle');
      setPercent(null);
      setErrorCode('');
      return undefined;
    }
    if (!canAutoMigrate()) return undefined;

    const unsub = window.desktopCashier.onPharmacyMigrate?.((payload) => {
      const type = payload?.type;
      if (type === 'started' || type === 'downloading') {
        setPhase('downloading');
        if (typeof payload.percent === 'number') setPercent(payload.percent);
      } else if (type === 'downloaded' || type === 'installing') {
        setPhase('installing');
        setPercent(100);
      } else if (type === 'launching') {
        setPhase('launching');
      } else if (type === 'error') {
        setPhase('error');
        setErrorCode(String(payload.code || 'generic'));
      }
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [open]);

  useEffect(() => {
    if (!open || !manifest?.windows?.url || startedRef.current) return undefined;
    if (!canAutoMigrate()) return undefined;

    startedRef.current = true;
    setPhase('downloading');
    setErrorCode('');

    let cancelled = false;
    (async () => {
      try {
        const result = await window.desktopCashier.migrateToPharmacyDesktop({
          url: absoluteInstallerUrl(manifest.windows.url),
          fileName: manifest.windows.fileName || 'Aurent-Pharmacy-setup.exe',
          sha256: manifest.windows.sha256 || '',
        });
        if (cancelled) return;
        if (!result?.ok) {
          setPhase('error');
          setErrorCode(String(result?.reason || 'generic'));
        }
      } catch {
        if (!cancelled) {
          setPhase('error');
          setErrorCode('generic');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, manifest, attempt]);

  const retry = () => {
    startedRef.current = false;
    setPercent(null);
    setErrorCode('');
    setPhase('idle');
    setAttempt((n) => n + 1);
  };

  return {
    autoEnabled: canAutoMigrate(),
    phase,
    percent,
    errorCode,
    retry,
    manualHref: absoluteInstallerUrl(manifest?.windows?.url) || '/downloads/pharmacy-desktop/',
  };
}
