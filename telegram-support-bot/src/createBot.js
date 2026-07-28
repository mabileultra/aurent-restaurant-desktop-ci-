import { Telegraf } from 'telegraf';
import { createBotApi } from './api/botApi.js';
import { createSupportForwarder } from './support/supportForwarder.js';
import { createSupportGroupStore } from './support/supportGroupStore.js';
import { createUserDataStore } from './state/userDataStore.js';
import { createUserStateStore } from './state/userStateStore.js';
import { isGroupChat } from './utils/telegramText.js';
import {
  handleCallback,
  handlePrivateMessage,
  showAbout,
  showMainMenu,
} from './handlers/menuRouter.js';
import { promptSearch, runMedicineSearch } from './handlers/searchFlow.js';
import { promptNearby, showFavorites, showHistory } from './handlers/nearbyFavoritesHistory.js';
import { showSupportCategories } from './handlers/supportFlow.js';

const BOT_COMMANDS = [
  { command: 'start', description: 'Открыть главное меню' },
  { command: 'find', description: 'Найти лекарство' },
  { command: 'nearby', description: 'Найти ближайшие аптеки' },
  { command: 'favorites', description: 'Избранные лекарства' },
  { command: 'history', description: 'История поиска' },
  { command: 'support', description: 'Связаться с поддержкой' },
  { command: 'help', description: 'Помощь' },
];

/**
 * Собирает полноценное мини-приложение Telegram-бота Aurent.
 */
export function createBot(config) {
  const bot = new Telegraf(config.token);
  const groupStore = createSupportGroupStore(config.supportGroupId);
  const botApi = createBotApi({
    backendBaseUrl: config.backendBaseUrl,
    botApiToken: config.botApiToken,
  });
  const stateStore = createUserStateStore();
  const dataStore = createUserDataStore(config.dataDir);

  const deps = {
    botApi,
    stateStore,
    dataStore,
    getGroupId: () => groupStore.getId(),
    forwardToGroup: null,
  };

  if (!config.supportGroupId) {
    console.warn('TELEGRAM_SUPPORT_GROUP_ID не задан — группа подхватится автоматически.');
  } else {
    console.log(`Группа поддержки: ${config.supportGroupId}`);
  }
  if (!config.botApiToken) {
    console.warn('TELEGRAM_BOT_API_TOKEN не задан — поиск лекарств будет недоступен.');
  }

  bot.on('my_chat_member', async (ctx) => {
    if (!isGroupChat(ctx.chat)) return;
    const status = ctx.myChatMember?.new_chat_member?.status;
    if (status === 'member' || status === 'administrator') {
      groupStore.connectGroup(ctx.chat);
    }
  });

  bot.start(async (ctx) => {
    if (ctx.chat?.type !== 'private') return;
    await showMainMenu(ctx, stateStore);
  });

  bot.help(async (ctx) => {
    if (ctx.chat?.type !== 'private') return;
    await showAbout(ctx, stateStore);
  });

  bot.command('find', async (ctx) => {
    if (ctx.chat?.type !== 'private') return;
    const query = ctx.message.text.replace(/^\/find(@\w+)?\s*/i, '').trim();
    if (query) {
      await runMedicineSearch(ctx, query, deps);
    } else {
      await promptSearch(ctx, stateStore);
    }
  });

  bot.command('nearby', async (ctx) => {
    if (ctx.chat?.type !== 'private') return;
    await promptNearby(ctx, stateStore);
  });

  bot.command('favorites', async (ctx) => {
    if (ctx.chat?.type !== 'private') return;
    await showFavorites(ctx, deps);
  });

  bot.command('history', async (ctx) => {
    if (ctx.chat?.type !== 'private') return;
    await showHistory(ctx, deps);
  });

  bot.command('support', async (ctx) => {
    if (ctx.chat?.type !== 'private') return;
    await showSupportCategories(ctx, stateStore);
  });

  bot.on('callback_query', async (ctx) => {
    if (ctx.chat?.type && ctx.chat.type !== 'private') return;
    try {
      await handleCallback(ctx, deps);
    } catch (err) {
      console.error('callback error:', err);
      await ctx.answerCbQuery('Ошибка').catch(() => {});
    }
  });

  bot.on('message', async (ctx) => {
    if (isGroupChat(ctx.chat)) {
      if (!groupStore.getId()) groupStore.connectGroup(ctx.chat);
      return;
    }
    if (ctx.chat?.type !== 'private') return;
    if (ctx.message.text?.startsWith('/')) return;

    deps.forwardToGroup = createSupportForwarder({
      telegram: ctx.telegram,
      getGroupId: () => groupStore.getId(),
    });

    try {
      await handlePrivateMessage(ctx, deps);
    } catch (err) {
      console.error('message error:', err);
      await ctx.reply('Произошла ошибка. Нажмите «Главное меню» или /start.');
    }
  });

  return {
    bot,
    async start() {
      // setMyCommands до launch: в Telegraf await launch() висит до остановки бота
      try {
        await bot.telegram.setMyCommands(BOT_COMMANDS);
        console.log('Команды бота обновлены');
      } catch (err) {
        console.warn('Не удалось setMyCommands:', err.message);
      }
      console.log('Aurent bot запущен (меню + поиск + поддержка)');
      await bot.launch();
    },
    stop(reason) {
      bot.stop(reason);
    },
  };
}
