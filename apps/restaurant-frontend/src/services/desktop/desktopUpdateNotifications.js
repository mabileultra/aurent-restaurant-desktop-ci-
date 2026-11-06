/**
 * Одно уведомление на цикл обновления кассы: available → progress → downloaded.
 * Ошибки подписи unsigned-сборок не показываем — шум electron-updater.
 */

export function isBenignUpdaterMessage(message) {
  const text = String(message || '').toLowerCase();
  return (
    text.includes('code signature')
    || text.includes('publisher name')
    || text.includes('publishername')
  );
}

export function classifyUpdaterError(message, code) {
  if (code === 'network' || code === 'install' || code === 'signature' || code === 'generic') {
    return code;
  }
  const text = String(message || '').toLowerCase();
  if (isBenignUpdaterMessage(text)) return 'signature';
  if (
    text.includes('net::')
    || text.includes('enotfound')
    || text.includes('econn')
    || text.includes('timed out')
    || text.includes('offline')
  ) {
    return 'network';
  }
  return 'generic';
}

export function updaterErrorBodyKey(code) {
  if (code === 'network') return 'rst.cashier.updateErrorNetwork';
  if (code === 'install') return 'rst.cashier.updateErrorInstall';
  if (code === 'signature') return 'rst.cashier.updateErrorSignature';
  return 'rst.cashier.updateErrorGeneric';
}

export function mapDesktopUpdateEvent(event) {
  if (event?.type === 'available') {
    return {
      id: 'desktop-update',
      updateState: 'progress',
      percent: 0,
      version: event.version || null,
      titleKey: 'rst.cashier.updateDownloadingTitle',
      bodyKey: 'rst.cashier.updateDownloadStarting',
      titleParams: { version: event.version || '' },
    };
  }
  if (event?.type === 'progress') {
    const percent = Math.max(0, Math.min(100, Number(event.percent) || 0));
    return {
      id: 'desktop-update',
      updateState: 'progress',
      percent,
      version: event.version || null,
      titleKey: 'rst.cashier.updateDownloadingTitle',
      bodyKey: percent > 0
        ? 'rst.cashier.updateDownloadingBody'
        : 'rst.cashier.updateDownloadStarting',
      bodyParams: { percent },
      titleParams: event.version ? { version: event.version } : undefined,
    };
  }
  if (event?.type === 'downloaded') {
    return {
      id: 'desktop-update',
      updateState: 'downloaded',
      version: event.version || null,
      titleKey: 'rst.cashier.updateReadyTitle',
      bodyKey: 'rst.cashier.updateReadyBody',
      titleParams: { version: event.version || '' },
      actionKey: 'rst.cashier.updateRestartNow',
    };
  }
  if (event?.type === 'error') {
    const errorCode = classifyUpdaterError(event.message, event.code);
    if (errorCode === 'signature') {
      return { skip: true };
    }
    return {
      id: 'desktop-update',
      updateState: 'error',
      errorCode,
      titleKey: 'rst.cashier.updateErrorTitle',
      bodyKey: updaterErrorBodyKey(errorCode),
      actionKey: 'rst.cashier.updateRetry',
    };
  }
  return null;
}

export function mergeDesktopUpdateState(prev, mapped) {
  if (!mapped || mapped.skip) return prev;
  if (
    mapped.updateState === 'error'
    && prev?.updateState === 'downloaded'
  ) {
    return prev;
  }
  // «available» is mapped to progress@0 — never regress a ready update.
  if (
    prev?.updateState === 'downloaded'
    && mapped.updateState === 'progress'
    && Number(mapped.percent || 0) < 1
  ) {
    return prev;
  }
  if (
    mapped.updateState === 'available'
    && (prev?.updateState === 'downloaded' || prev?.updateState === 'progress')
  ) {
    return prev;
  }
  // Keep version from earlier events while progress often omits it.
  if (
    mapped.updateState === 'progress'
    && prev?.version
    && !mapped.version
  ) {
    return { ...mapped, version: prev.version };
  }
  // Never let a 0% progress regress a higher percent.
  if (
    mapped.updateState === 'progress'
    && prev?.updateState === 'progress'
    && Number(mapped.percent || 0) < Number(prev.percent || 0)
  ) {
    return prev;
  }
  return mapped;
}
