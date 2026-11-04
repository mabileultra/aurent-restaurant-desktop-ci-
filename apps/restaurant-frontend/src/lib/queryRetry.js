function statusOf(error) {
  return error?.response?.status ?? error?.status ?? null;
}

/** Transient gateway/network blips should stay in loading, not an error banner. */
export function shouldRetryQuery(failureCount, error) {
  const status = statusOf(error);
  if (status === 401 || status === 403 || status === 404) return false;
  if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) return false;
  return failureCount < 2;
}

export function queryRetryDelay(attempt) {
  return Math.min(1000, 300 * attempt);
}
