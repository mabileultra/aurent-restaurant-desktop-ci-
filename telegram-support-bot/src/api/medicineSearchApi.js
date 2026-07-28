/**
 * HTTP-клиент поиска лекарств в POS backend.
 */
export function createMedicineSearchApi({ backendBaseUrl, botApiToken }) {
  return {
    async search(query) {
      if (!botApiToken) {
        const err = new Error('TELEGRAM_BOT_API_TOKEN не задан');
        err.code = 'BOT_API_NOT_CONFIGURED';
        throw err;
      }

      const url = new URL(`${backendBaseUrl}/public/bot/medicine/search`);
      url.searchParams.set('q', query);

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
          // ignore parse errors
        }
        const err = new Error(message);
        err.status = response.status;
        throw err;
      }

      return response.json();
    },
  };
}
