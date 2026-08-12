import { loadBotConfigs } from './src/config.js';
import { createBot } from './src/createBot.js';

const apps = [];

async function main() {
  let configs;
  try {
    configs = await loadBotConfigs();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  if (!configs.length) {
    console.error('Нет ни одного аптечного бота для запуска');
    process.exit(1);
  }

  console.log(`Запуск ${configs.length} аптечн(ых) бот(ов)...`);

  for (const config of configs) {
    const app = createBot(config);
    apps.push({ app, label: config.label, companyId: config.companyId });
    app.start()
      .then(() => console.log(`✓ Бот «${config.label}» (company=${config.companyId || 'legacy'}) запущен`))
      .catch((err) => {
        console.error(`✗ Бот «${config.label}» не запустился:`, err.message || err);
      });
  }
}

main().catch((err) => {
  console.error('Не удалось запустить ботов:', err);
  process.exit(1);
});

function stopAll(reason) {
  for (const { app, label } of apps) {
    try {
      app.stop(reason);
      console.log(`Остановлен «${label}»`);
    } catch (err) {
      console.error(`Ошибка остановки «${label}»:`, err.message || err);
    }
  }
}

process.once('SIGINT', () => stopAll('SIGINT'));
process.once('SIGTERM', () => stopAll('SIGTERM'));
