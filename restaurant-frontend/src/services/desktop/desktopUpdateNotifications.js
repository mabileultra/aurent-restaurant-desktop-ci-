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
      updateState: 'available',
      version: event.version || null,
      titleKey: 'rst.cashier.updateAvailableTitle',
      bodyKey: 'rst.cashier.updateAvailableBody',
      titleParams: { version: event.version || '' },
    };
  }
  if (event?.type === 'progress') {
    return {
      id: 'desktop-update',
      updateState: 'progress',
      percent: event.percent || 0,
      version: event.version || null,
      titleKey: 'rst.cashier.updateDownloadingTitle',
      bodyKey: 'rst.cashier.updateDownloadingBody',
      bodyParams: { percent: event.percent || 0 },
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
  if (
    mapped.updateState === 'available'
    && (prev?.updateState === 'downloaded' || prev?.updateState === 'progress')
  ) {
    return prev;
  }
  // Keep version from available while progress events usually omit it.
  if (
    mapped.updateState === 'progress'
    && prev?.version
    && !mapped.version
  ) {
    return { ...mapped, version: prev.version };
  }
  return mapped;
}
