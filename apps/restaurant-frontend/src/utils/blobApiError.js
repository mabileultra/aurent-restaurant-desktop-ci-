/**
 * Axios + responseType:'blob' puts error JSON/HTML into a Blob — unwrap for toasts.
 */

async function blobToText(data, max = 4000) {
  if (data == null) return '';
  if (typeof data === 'string') return data.slice(0, max);
  if (data instanceof Blob) {
    return (await data.slice(0, max).text());
  }
  if (data instanceof ArrayBuffer) {
    return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(data).slice(0, max));
  }
  return '';
}

function looksLikeHtml(text) {
  const t = String(text || '').trimStart().toLowerCase();
  return t.startsWith('<!doctype') || t.startsWith('<html') || t.includes('<html');
}

/**
 * @param {unknown} error axios error
 * @param {string} fallback
 * @returns {Promise<string>}
 */
export async function getBlobAwareApiErrorMessage(error, fallback = '') {
  const data = error?.response?.data;
  if (data && typeof data === 'object' && !(data instanceof Blob) && !(data instanceof ArrayBuffer)) {
    const msg = typeof data.message === 'string' ? data.message.trim() : '';
    if (msg) return msg;
  }

  const text = await blobToText(data);
  if (text) {
    try {
      const json = JSON.parse(text);
      if (typeof json?.message === 'string' && json.message.trim()) {
        return json.message.trim();
      }
    } catch {
      /* not JSON */
    }
    if (looksLikeHtml(text)) {
      return 'Сессия истекла или нет доступа. Войдите снова и скачайте шаблон заново.';
    }
  }

  const status = error?.response?.status;
  if (status === 401 || status === 403) {
    return 'Нет доступа к шаблону. Войдите как ADMIN или MANAGER.';
  }
  if (status === 502 || status === 503 || status === 504) {
    return 'Сервер временно недоступен. Попробуйте позже.';
  }

  if (typeof error?.message === 'string' && error.message && !error.response) {
    return error.message;
  }

  return fallback || 'Ошибка запроса';
}
