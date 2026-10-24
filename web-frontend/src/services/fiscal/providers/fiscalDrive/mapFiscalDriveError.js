const CODE_MESSAGES = Object.freeze({
  '0x9030': 'Время чека в прошлом относительно последней операции ФМ',
  '0x9031': 'ФМ заблокирован — слишком много неотправленных чеков (сверьте с ОФД)',
  '0x90f1': 'ФМ заблокирован — слишком много неотправленных чеков (сверьте с ОФД)',
  '0x9032': 'Нельзя закрыть пустой Z-отчёт',
  '0x9035': 'Недостаточно продаж для возврата',
  '0x9091': 'Часы ФМ впереди — нужна синхронизация времени',
  '0x9021': 'Z-отчёт не открыт',
  '0x9022': 'Z-отчёт не закрыт',
});

const NAME_TO_CODE = Object.freeze({
  ME_SYNC_WITH_SERVER: '0x9091',
});

/** Апплет 0400 кладёт код в `"n":"9091 - ME_SYNC_WITH_SERVER"`, без префикса 0x. */
const APPLET_CODE = /(?:0x([0-9a-fA-F]{4}))|(?:"n"\s*:\s*"([0-9a-fA-F]{4}))|\b([0-9a-fA-F]{4})\s*-\s*[A-Z][A-Z0-9_]+/;

function errorText(err) {
  if (err == null) return '';
  if (typeof err === 'string') return err;
  const parts = [err.message];
  const data = err.data;
  if (typeof data === 'string') parts.push(data);
  else if (data && typeof data === 'object') {
    parts.push(data.message, data.Message, data.n, data.Code, data.code);
    try {
      parts.push(JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }
  return parts.filter((part) => part != null && part !== '').join(' ');
}

function extractHexCode(text) {
  const match = text.match(APPLET_CODE);
  const digits = match?.[1] || match?.[2] || match?.[3];
  if (digits) return `0x${digits.toLowerCase()}`;
  for (const [name, code] of Object.entries(NAME_TO_CODE)) {
    if (text.includes(name)) return code;
  }
  return null;
}

function extractAppletName(text) {
  const match = text.match(/\b[0-9a-fA-F]{4}\s*-\s*([A-Z][A-Z0-9_]+)/);
  return match?.[1] || null;
}

function looksLikeAppletDump(text) {
  return /SWError|CloseZReport|OpenZReport|failed to execute command|"n"\s*:|applet_impl\.go/i.test(text);
}

function shortAppletMessage(hex, name) {
  const label = [hex ? hex.replace(/^0x/i, '') : null, name].filter(Boolean).join(' — ');
  return label ? `Ошибка фискального модуля (${label})` : 'Ошибка фискального модуля';
}

export function mapFiscalDriveError(err) {
  if (err?.code?.startsWith('FISCAL_DRIVE') && err?.fiscalDriveCode) return err;
  const raw = errorText(err);
  const hex = extractHexCode(raw);
  const known = hex ? CODE_MESSAGES[hex] : null;
  const name = extractAppletName(raw);
  let message = known || raw || 'Ошибка FiscalDrive';
  if (/invalid DateTime field value|cannot parse "" as "2006"|ParseError/i.test(raw)) {
    message = 'FiscalDrive не принял дату чека — повторите продажу из Aurent Desktop';
  }
  if (!known && looksLikeAppletDump(raw)) {
    message = shortAppletMessage(hex, name);
  }
  const wrapped = new Error(message);
  wrapped.code = 'FISCAL_DRIVE_FISCAL_FAILED';
  wrapped.fiscalDriveCode = hex;
  wrapped.cause = err;
  wrapped.data = err?.data;
  return wrapped;
}

function errorCodeAndText(err) {
  const mapped = err?.fiscalDriveCode ? err : mapFiscalDriveError(err);
  return `${mapped.fiscalDriveCode || ''} ${mapped.message || ''} ${errorText(err)}`;
}

/** 0x9022/0x9023 — Z уже открыт, повторный Open не ошибка продажи. */
export function isFiscalDriveShiftAlreadyOpenError(err) {
  return /0x9022|0x9023|already.?open|уже.*(открыт)|Z-отчёт не закрыт/i.test(errorCodeAndText(err));
}

/** 0x9021 — чек нельзя зарегистрировать, пока Z не открыт. */
export function isFiscalDriveZNotOpenError(err) {
  return /0x9021|Z-отчёт не открыт|z.?report.*not.?open/i.test(errorCodeAndText(err));
}

/** ФМ заблокирован или часы впереди — нужна State/Sync. */
export function isFiscalDriveNeedsSyncError(err) {
  return /0x9031|0x90f1|0x9091|ME_SYNC_WITH_SERVER|заблок/i.test(errorCodeAndText(err));
}
