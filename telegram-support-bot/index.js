import { loadBotConfig } from './src/config.js';
import { createBot } from './src/createBot.js';

let config;
try {
  config = loadBotConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const app = createBot(config);

app.start().catch((err) => {
  console.error('Не удалось запустить бота:', err);
  process.exit(1);
});

process.once('SIGINT', () => app.stop('SIGINT'));
process.once('SIGTERM', () => app.stop('SIGTERM'));
