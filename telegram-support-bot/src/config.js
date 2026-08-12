import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Загрузка конфигов аптечных ботов.
 * 1) TELEGRAM_BOT_RUNTIME_TOKEN → GET /public/bot/runtime/instances (динамически по компаниям)
 * 2) TELEGRAM_BOTS JSON (ручной список)
 * 3) Legacy: один TELEGRAM_BOT_TOKEN
 */
export async function loadBotConfigs() {
  const backendBaseUrl = (
    process.env.TELEGRAM_BOT_BACKEND_URL
    || process.env.BACKEND_URL
    || 'http://backend:8080/api/v1'
  ).replace(/\/$/, '');

  const dataRoot = process.env.TELEGRAM_BOT_DATA_DIR?.trim()
    || path.join(__dirname, '..', 'data');

  const runtimeToken = process.env.TELEGRAM_BOT_RUNTIME_TOKEN?.trim();
  if (runtimeToken) {
    const configs = await loadFromRuntime(backendBaseUrl, runtimeToken, dataRoot);
    if (configs.length) {
      return configs;
    }
    console.warn('Runtime API вернул 0 ботов — пробуем TELEGRAM_BOTS / legacy.');
  }

  const fromJson = parseBotsJson(process.env.TELEGRAM_BOTS, backendBaseUrl, dataRoot);
  if (fromJson.length) {
    return fromJson;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error(
      'Задайте TELEGRAM_BOT_RUNTIME_TOKEN (боты из БД) или TELEGRAM_BOTS JSON или TELEGRAM_BOT_TOKEN'
    );
  }

  return [{
    label: 'legacy',
    companyId: process.env.TELEGRAM_BOT_COMPANY_ID?.trim() || null,
    token,
    supportGroupId: process.env.TELEGRAM_SUPPORT_GROUP_ID?.trim() || null,
    backendBaseUrl,
    botApiToken: process.env.TELEGRAM_BOT_API_TOKEN?.trim() || '',
    dataDir: dataRoot,
  }];
}

async function loadFromRuntime(backendBaseUrl, runtimeToken, dataRoot) {
  const url = `${backendBaseUrl}/public/bot/runtime/instances`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Bot-Runtime-Token': runtimeToken,
    },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Runtime instances HTTP ${response.status}: ${text.slice(0, 200)}`);
  }
  const list = await response.json();
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .filter((row) => row?.botToken && row?.apiToken)
    .map((row) => ({
      label: row.botUsername || row.companyName || `company-${row.companyId}`,
      companyId: row.companyId != null ? String(row.companyId) : null,
      token: String(row.botToken).trim(),
      supportGroupId: row.supportGroupId ? String(row.supportGroupId).trim() : null,
      backendBaseUrl,
      botApiToken: String(row.apiToken).trim(),
      dataDir: path.join(dataRoot, `company-${row.companyId}`),
    }));
}

function parseBotsJson(raw, backendBaseUrl, dataRoot) {
  if (!raw?.trim()) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('TELEGRAM_BOTS должен быть валидным JSON-массивом');
  }
  if (!Array.isArray(parsed)) {
    throw new Error('TELEGRAM_BOTS должен быть массивом');
  }
  return parsed.map((row, index) => {
    const token = String(row.token || row.botToken || '').trim();
    const apiToken = String(row.apiToken || row.botApiToken || '').trim();
    if (!token) {
      throw new Error(`TELEGRAM_BOTS[${index}]: нет token`);
    }
    const companyId = row.companyId != null ? String(row.companyId) : null;
    return {
      label: row.label || row.botUsername || `bot-${index + 1}`,
      companyId,
      token,
      supportGroupId: row.supportGroupId ? String(row.supportGroupId).trim() : null,
      backendBaseUrl,
      botApiToken: apiToken,
      dataDir: path.join(dataRoot, companyId ? `company-${companyId}` : `bot-${index + 1}`),
    };
  });
}

/** @deprecated use loadBotConfigs */
export function loadBotConfig() {
  throw new Error('Используйте async loadBotConfigs()');
}
