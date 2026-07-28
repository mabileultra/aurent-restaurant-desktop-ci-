import { loadBotConfig } from './src/config.js';
import { createBot } from './src/createBot.js';

let config;
try {
  config = loadBotConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const bot = createBot(config);

bot.launch().then(() => {
  console.log('Бот Aurent запущен (поиск лекарств + поддержка)');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
