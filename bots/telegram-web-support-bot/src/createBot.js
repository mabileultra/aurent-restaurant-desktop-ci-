import { Telegraf } from 'telegraf';
import { createGroupStore } from './support/groupStore.js';
import { createTicketStore } from './support/ticketStore.js';
import { createUserStateStore, STATES } from './state/userStateStore.js';
import { isGroupChat } from './utils/telegramText.js';
import { handleGroupReply } from './handlers/groupReplyHandler.js';
import {
  appendOrCreate,
  closeTicket,
  prepareAppend,
  selectCategory,
  showCategories,
  showHelp,
  showTicketStatus,
  showWelcome,
} from './handlers/supportHandler.js';

const BOT_COMMANDS = [
  { command: 'start', description: 'Открыть поддержку' },
  { command: 'support', description: 'Новое обращение' },
  { command: 'help', description: 'Справка' },
];

export function createWebSupportBot(config) {
  const bot = new Telegraf(config.token);
  const groupStore = createGroupStore(config.supportGroupId);
  const ticketStore = createTicketStore(config.dataDir);
  const stateStore = createUserStateStore();

  const deps = {
    stateStore,
    ticketStore,
    getGroupId: () => groupStore.getId(),
  };

  if (!config.supportGroupId) {
    console.warn('TELEGRAM_WEB_SUPPORT_GROUP_ID не задан — группа подхватится автоматически.');
  } else {
    console.log(`Группа веб-поддержки: ${config.supportGroupId}`);
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
    await showWelcome(ctx, stateStore);
  });

  bot.help(async (ctx) => {
    if (ctx.chat?.type !== 'private') return;
    await showHelp(ctx, stateStore);
  });

  bot.command('support', async (ctx) => {
    if (ctx.chat?.type !== 'private') return;
    await showCategories(ctx, stateStore);
  });

  bot.on('callback_query', async (ctx) => {
    if (ctx.chat?.type && ctx.chat.type !== 'private') return;
    const data = ctx.callbackQuery?.data || '';
    const [action, payload] = data.split(':');
    try {
      if (action === 'cat') return selectCategory(ctx, payload, stateStore);
      if (action === 'tstat') return showTicketStatus(ctx, payload, deps);
      if (action === 'tadd') return prepareAppend(ctx, payload, stateStore);
      if (action === 'tclose') return closeTicket(ctx, payload, deps);
      await ctx.answerCbQuery().catch(() => {});
    } catch (err) {
      console.error('web support callback error:', err);
      await ctx.answerCbQuery('Ошибка').catch(() => {});
    }
  });

  bot.on('message', async (ctx) => {
    if (isGroupChat(ctx.chat)) {
      if (!groupStore.getId()) groupStore.connectGroup(ctx.chat);
      try {
        await handleGroupReply(ctx, deps);
      } catch (err) {
        console.error('web support group reply error:', err);
      }
      return;
    }
    if (ctx.chat?.type !== 'private') return;
    if (ctx.message.text?.startsWith('/')) return;

    const text = ctx.message.text?.trim();
    try {
      if (text === '🆘 Поддержка') {
        await showCategories(ctx, stateStore);
        return;
      }
      if (text === 'ℹ️ Помощь') {
        await showHelp(ctx, stateStore);
        return;
      }

      const state = stateStore.get(ctx.from.id);
      if (state.state === STATES.WAIT_MESSAGE || state.state === STATES.ACTIVE) {
        if (state.state === STATES.ACTIVE && text) {
          await ctx.reply(
            'У вас есть открытое обращение.\nНажмите «➕ Дополнить» или «🆘 Поддержка» для нового.'
          );
          return;
        }
        await appendOrCreate(ctx, deps);
        return;
      }
      if (state.state === STATES.WAIT_CATEGORY) {
        await ctx.reply('Выберите категорию кнопкой выше.');
        return;
      }

      if (ctx.message.photo || ctx.message.document) {
        await showCategories(ctx, stateStore);
        await ctx.reply('Выберите категорию, затем пришлите файл ещё раз.');
        return;
      }

      await showWelcome(ctx, stateStore);
    } catch (err) {
      console.error('web support message error:', err);
      await ctx.reply('Произошла ошибка. Нажмите /start.');
    }
  });

  return {
    bot,
    async start() {
      try {
        await bot.telegram.setMyCommands(BOT_COMMANDS);
        console.log('Команды веб-бота поддержки обновлены');
      } catch (err) {
        console.warn('Не удалось setMyCommands:', err.message);
      }
      console.log('Aurent WEB support bot запущен');
      await bot.launch();
    },
    stop(reason) {
      bot.stop(reason);
    },
  };
}
