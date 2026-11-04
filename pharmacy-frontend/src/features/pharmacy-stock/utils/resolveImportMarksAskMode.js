/**
 * Режим модалки КМ после импорта.
 * @returns {'idle' | 'no-asl' | 'ask' | 'verifying' | 'result'}
 */
export function resolveImportMarksAskMode({
  askOpen = false,
  aslReady = false,
  aslEnabled = false,
  verifying = false,
  hasResult = false,
} = {}) {
  if (!askOpen) return 'idle';
  if (!aslReady) return 'idle';
  if (hasResult) return 'result';
  if (verifying) return 'verifying';
  if (!aslEnabled) return 'no-asl';
  return 'ask';
}
