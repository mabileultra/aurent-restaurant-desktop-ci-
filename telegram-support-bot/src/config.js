import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Конфиг Telegram-бота из env.
 */
export function loadBotConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error('Задайте TELEGRAM_BOT_TOKEN в .env');
  }

  return {
    token,
    supportGroupId: process.env.TELEGRAM_SUPPORT_GROUP_ID?.trim() || null,
    backendBaseUrl: (
      process.env.TELEGRAM_BOT_BACKEND_URL
      || process.env.BACKEND_URL
      || 'http://backend:8080/api/v1'
    ).replace(/\/$/, ''),
    botApiToken: process.env.TELEGRAM_BOT_API_TOKEN?.trim() || '',
    dataDir: process.env.TELEGRAM_BOT_DATA_DIR?.trim()
      || path.join(__dirname, '..', 'data'),
  };
}
