/** Chromium net errors that mean «нет сети / DNS / обрыв», не «битый сервер». */
const NETWORK_LOAD_ERROR_CODES = new Set([
  -2, // FAILED
  -3, // ABORTED (иногда при offline)
  -6, // FILE_NOT_FOUND (редко при offline cache)
  -7, // TIMED_OUT
  -21, // NETWORK_CHANGED
  -100, // CONNECTION_CLOSED
  -101, // CONNECTION_RESET
  -102, // CONNECTION_REFUSED
  -104, // CONNECTION_FAILED
  -105, // NAME_NOT_RESOLVED
  -106, // INTERNET_DISCONNECTED
  -109, // ADDRESS_UNREACHABLE
  -118, // CONNECTION_TIMED_OUT
]);

function isNetworkLoadError(errorCode) {
  return NETWORK_LOAD_ERROR_CODES.has(Number(errorCode));
}

module.exports = { NETWORK_LOAD_ERROR_CODES, isNetworkLoadError };
