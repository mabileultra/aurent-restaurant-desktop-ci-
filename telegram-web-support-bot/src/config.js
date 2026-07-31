export function loadConfig() {
  const token = process.env.TELEGRAM_WEB_SUPPORT_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error('Задайте TELEGRAM_WEB_SUPPORT_BOT_TOKEN в .env');
  }

  return {
    token,
    supportGroupId: process.env.TELEGRAM_WEB_SUPPORT_GROUP_ID?.trim() || null,
    dataDir: process.env.TELEGRAM_WEB_SUPPORT_DATA_DIR?.trim() || './data',
  };
}
