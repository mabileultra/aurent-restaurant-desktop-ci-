/**
 * Одно уведомление на цикл обновления кассы: available → progress → downloaded.
 * Ошибки подписи unsigned-сборок не показываем — это шум electron-updater.
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
  if (code === 'network') return 'notifications.updateErrorNetwork';
  if (code === 'install') return 'notifications.updateErrorInstall';
  if (code === 'signature') return 'notifications.updateErrorSignature';
  return 'notifications.updateErrorGeneric';
}

export function mapDesktopUpdateEvent(event) {
  if (event?.type === 'available') {
    return {
      id: 'desktop-update',
      source: 'update',
      kind: 'UPDATE',
      titleKey: 'notifications.updateAvailableTitle',
      titleParams: { version: event.version || '' },
      bodyKey: 'notifications.updateAvailableBody',
      createdAt: new Date().toISOString(),
      updateState: 'available',
      version: event.version || null,
    };
  }
  if (event?.type === 'progress') {
    return {
      id: 'desktop-update',
      source: 'update',
      kind: 'UPDATE',
      titleKey: 'notifications.updateDownloadingTitle',
      bodyKey: 'notifications.updateDownloadingBody',
      bodyParams: { percent: event.percent || 0 },
      createdAt: new Date().toISOString(),
      updateState: 'progress',
      percent: event.percent || 0,
      version: event.version || null,
    };
  }
  if (event?.type === 'downloaded') {
    return {
      id: 'desktop-update',
      source: 'update',
      kind: 'UPDATE',
      titleKey: 'notifications.updateReadyTitle',
      titleParams: { version: event.version || '' },
      bodyKey: 'notifications.updateReadyBody',
      createdAt: new Date().toISOString(),
      updateState: 'downloaded',
      version: event.version || null,
      actionKey: 'notifications.restartNow',
    };
  }
  if (event?.type === 'error') {
    const errorCode = classifyUpdaterError(event.message, event.code);
    if (errorCode === 'signature') {
      return { skip: true };
    }
    return {
      id: 'desktop-update',
      source: 'update',
      kind: 'ALERT',
      titleKey: 'notifications.updateErrorTitle',
      bodyKey: updaterErrorBodyKey(errorCode),
      createdAt: new Date().toISOString(),
      updateState: 'error',
      errorCode,
      actionKey: 'notifications.retryUpdate',
    };
  }
  return null;
}

export function mergeDesktopUpdateItem(prev, mapped) {
  if (!mapped || mapped.skip) return prev;
  const rest = prev.filter((item) => item.source !== 'update');
  const current = prev.find((item) => item.source === 'update');

  if (mapped.updateState === 'error' && current?.updateState === 'downloaded') {
    return prev;
  }
  if (
    mapped.updateState === 'available'
    && (current?.updateState === 'downloaded' || current?.updateState === 'progress')
  ) {
    return prev;
  }

  return [mapped, ...rest];
}
