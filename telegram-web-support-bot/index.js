#!/usr/bin/env node
import { loadConfig } from './src/config.js';
import { createWebSupportBot } from './src/createBot.js';

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const app = createWebSupportBot(config);

app.start().catch((err) => {
  console.error('Не удалось запустить веб-бот поддержки:', err);
  process.exit(1);
});

process.once('SIGINT', () => app.stop('SIGINT'));
process.once('SIGTERM', () => app.stop('SIGTERM'));
