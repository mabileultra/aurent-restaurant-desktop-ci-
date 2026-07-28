/**
 * HTTP-клиент Telegram bot API к POS backend.
 */
export function createBotApi({ backendBaseUrl, botApiToken }) {
  async function request(pathname, query = {}) {
    if (!botApiToken) {
      const err = new Error('TELEGRAM_BOT_API_TOKEN не задан');
      err.code = 'BOT_API_NOT_CONFIGURED';
      throw err;
    }
    const url = new URL(`${backendBaseUrl}${pathname}`);
    for (const [k, v] of Object.entries(query)) {
      if (v != null) url.searchParams.set(k, String(v));
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Bot-Token': botApiToken,
      },
    });
    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const body = await response.json();
        message = body.message || body.error || message;
      } catch {
        // ignore
      }
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }
    return response.json();
  }

  return {
    search: (q) => request('/public/bot/medicine/search', { q }),
    product: (productId) => request(`/public/bot/medicine/${productId}`),
    stores: () => request('/public/bot/stores'),
  };
}
