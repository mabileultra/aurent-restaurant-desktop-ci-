import { FORBIDDEN_MXIK_REASON_CODE } from '@aurent/shared-fiscal';

/**
 * @param {unknown} error
 * @param {Function} t
 * @returns {string|null}
 */
export function resolveForbiddenMxikError(error, t) {
  const data = error?.response?.data;
  const reasonCode =
    data?.context?.reasonCode || error?.context?.reasonCode || error?.code || error?.reasonCode;
  const mxik = data?.context?.mxik || error?.mxik;
  if (reasonCode === FORBIDDEN_MXIK_REASON_CODE || reasonCode === 'FORBIDDEN_MXIK') {
    return t('pos.forbiddenMxik', {
      mxik: mxik || '',
      defaultValue: mxik
        ? `Нельзя продать товар с запрещённым MXIK ${mxik}`
        : 'Нельзя продать товар с запрещённым кодом MXIK',
    });
  }
  const message = data?.message || error?.message;
  if (typeof message === 'string' && message.startsWith('FORBIDDEN_MXIK:')) {
    const code = message.slice('FORBIDDEN_MXIK:'.length);
    return t('pos.forbiddenMxik', {
      mxik: code,
      defaultValue: `Нельзя продать товар с запрещённым MXIK ${code}`,
    });
  }
  return null;
}
