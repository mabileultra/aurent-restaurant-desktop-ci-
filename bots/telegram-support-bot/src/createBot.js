import { Telegraf } from 'telegraf';
import { createBotApi } from './api/botApi.js';
import { createSupportForwarder } from './support/supportForwarder.js';
import { createSupportGroupStore } from './support/supportGroupStore.js';
import { handleSupportGroupReply } from './support/groupReplyHandler.js';
import { createUserDataStore } from './state/userDataStore.js';
import { createUserStateStore } from './state/userStateStore.js';
import { isGroupChat } from './utils/telegramText.js';
import { mainMenuKeyboard } from './keyboards/menus.js';
import { showMainMenu, showAbout } from './handlers/mainMenu.js';
import { promptSearch, runMedicineSearch } from './handlers/searchFlow.js';
import { promptNearby } from './handlers/nearbyFlow.js';
import { showFavorites, showHistory } from './handlers/favoritesHistory.js';
import { showSupportMenu } from './handlers/supportFlow.js';
import { handleCallback, handlePrivateMessage } from './handlers/router.js';

const BOT_COMMANDS = [
  { command: 'start', description: 'Главное меню' },
  { command: 'find', description: 'Найти лекарство' },
  { command: 'nearby', description: 'Аптеки рядом' },
  { command: 'favorites', description: 'Избранное' },
  { command: 'history', description: 'История поиска' },
  { command: 'support', description: 'Поддержка' },
  { command: 'help', description: 'О сервисе' },
];

/**
 * Аптечный Telegram-бот Aurent (поиск лекарств + аптеки + поддержка).
 */
export function createBot(config) {
  const bot = new Telegraf(config.token);
  const groupStore = createSupportGroupStore(config.supportGroupId, config.dataDir);
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

  const label = config.label || 'pharmacy';
  if (!config.supportGroupId) {
    console.warn(`[${label}] supportGroupId не задан — группа подхватится автоматически.`);
  } else {
    console.log(`[${label}] Группа поддержки: ${config.supportGroupId}`);
  }
  if (!config.botApiToken) {
    console.warn(`[${label}] botApiToken не задан — поиск лекарств будет недоступен.`);
  } else if (config.companyId) {
    console.log(`[${label}] Привязка к компании id=${config.companyId}`);
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
    if (query) await runMedicineSearch(ctx, query, deps);
    else await promptSearch(ctx, stateStore);
  });

  bot.command('nearby', async (ctx) => {
    if (ctx.chat?.type !== 'private') return;
    await promptNearby(ctx, deps);
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
    await showSupportMenu(ctx, stateStore);
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
      try {
        await handleSupportGroupReply(ctx, deps);
      } catch (err) {
        console.error('group reply error:', err);
      }
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
      await ctx.reply(
        '⚠️ Произошла ошибка. Нажмите «🏠 Главное меню» или /start.',
        mainMenuKeyboard()
      );
    }
  });

  return {
    bot,
    async start() {
      try {
        await bot.telegram.setMyCommands(BOT_COMMANDS);
        console.log(`[${label}] Команды бота обновлены`);
      } catch (err) {
        console.warn(`[${label}] Не удалось setMyCommands:`, err.message);
      }
      console.log(`[${label}] Aurent pharmacy bot запущен`);
      await bot.launch();
    },
    stop(reason) {
      bot.stop(reason);
    },
  };
}
