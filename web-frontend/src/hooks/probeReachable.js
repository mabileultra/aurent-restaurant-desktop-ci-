/** HEAD к серверу. Ответ с любым статусом значит, что сеть есть. */
export async function probeReachable(probeUrl, timeoutMs = 4_000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${probeUrl}?_t=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    return Boolean(res && res.status > 0);
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
