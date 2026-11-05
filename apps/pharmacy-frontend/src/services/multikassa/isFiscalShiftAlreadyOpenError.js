/**
 * Фискальный модуль уже в открытой смене. POS-смену в этом случае закрывать нельзя:
 * иначе касса снова просит «откройте смену», а повторный open снова падает.
 */
export function isFiscalShiftAlreadyOpenError(err) {
  const raw = String(
    err?.response?.data?.message
      ?? err?.data?.message
      ?? err?.data?.error
      ?? err?.message
      ?? '',
  );
  if (/не\s+открыт/i.test(raw)) return false;
  return /уже\s+открыт|смена\s+открыт|already\s+open|shift_already|allaqachon\s+ochiq/i.test(raw);
}
