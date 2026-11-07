import { multikassaHttpRequest } from './multikassaHttpClient';

export function getContragents(baseUrl, { refresh = false } = {}) {
  const path = refresh ? '/api/v1/contragents?refresh=1' : '/api/v1/contragents';
  return multikassaHttpRequest({ baseUrl, method: 'GET', path });
}

export function getFiscalDrives(baseUrl) {
  return multikassaHttpRequest({ baseUrl, method: 'GET', path: '/api/v1/fiscal_drives' });
}

/** Некоторые сборки MK fiscal отдают drives под другими путями — пробуем по очереди. */
export async function getFiscalDrivesWithFallback(baseUrl) {
  const paths = [
    '/api/v1/fiscal_drives',
    '/api/v1/fiscal-drives',
    '/api/v1/fiscal_drives?refresh=1',
    '/api/v1/modules',
    '/api/v1/devices/fiscal',
  ];
  let lastErr = null;
  for (const path of paths) {
    try {
      const data = await multikassaHttpRequest({ baseUrl, method: 'GET', path });
      return { data, path };
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr) throw lastErr;
  return { data: [], path: paths[0] };
}

export function selectFiscalDrive(baseUrl, body) {
  return multikassaHttpRequest({
    baseUrl,
    method: 'POST',
    path: '/api/v1/fiscal_drives/select',
    body,
  });
}

export function getPrinters(baseUrl) {
  return multikassaHttpRequest({ baseUrl, method: 'GET', path: '/api/v1/devices/printers' });
}

/** Пробуем известные пути списка принтеров MK Fiscal. */
export async function getPrintersWithFallback(baseUrl) {
  const paths = [
    '/api/v1/devices/printers',
    '/api/v1/printers',
    '/api/v1/devices/printer',
  ];
  let lastErr = null;
  for (const path of paths) {
    try {
      const data = await multikassaHttpRequest({ baseUrl, method: 'GET', path });
      return { data, path };
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr) throw lastErr;
  return { data: [], path: paths[0] };
}

export function selectPrinter(baseUrl, body) {
  return multikassaHttpRequest({
    baseUrl,
    method: 'POST',
    path: '/api/v1/devices/printers/select',
    body,
  });
}

export function postOperation(baseUrl, body) {
  return multikassaHttpRequest({
    baseUrl,
    method: 'POST',
    path: '/api/v1/operations',
    body,
  });
}

export function getOperations(baseUrl) {
  return multikassaHttpRequest({
    baseUrl,
    method: 'GET',
    path: '/api/v1/operations',
  });
}
