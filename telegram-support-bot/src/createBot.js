import { Telegraf } from 'telegraf';
import { createMedicineSearchApi } from './api/medicineSearchApi.js';
import { handleMedicineSearch } from './handlers/medicineSearchHandler.js';
import { handleStart } from './handlers/startHandler.js';
import { handleSupportMessage } from './handlers/supportHandler.js';
import { createSupportForwarder } from './support/supportForwarder.js';
import { createSupportGroupStore } from './support/supportGroupStore.js';
import { isGroupChat } from './utils/telegramText.js';

/**
 * Собирает и запускает Telegram-бота (поиск лекарств + поддержка).
 */
export function createBot(config) {
  const bot = new Telegraf(config.token);
  const groupStore = createSupportGroupStore(config.supportGroupId);
  const medicineApi = createMedicineSearchApi({
    backendBaseUrl: config.backendBaseUrl,
    botApiToken: config.botApiToken,
  });

  const supportSessions = new Set();

  if (!config.supportGroupId) {
    console.warn(
      'TELEGRAM_SUPPORT_GROUP_ID не задан — добавьте бота в группу и напишите там сообщение, ID подхватится автоматически.'
    );
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

  bot.start(handleStart);

  bot.command('find', async (ctx) => {
    if (ctx.chat?.type !== 'private') return;
    const query = ctx.message.text.replace(/^\/find(@\w+)?\s*/i, '').trim();
    supportSessions.delete(ctx.from.id);
    await handleMedicineSearch(ctx, query, medicineApi);
  });

  bot.command('support', async (ctx) => {
    if (ctx.chat?.type !== 'private') return;
    supportSessions.add(ctx.from.id);
    await ctx.reply(
      'Режим поддержки включён.\nОпишите проблему текстом, фото или документом.\n\nЧтобы снова искать лекарства — просто напишите название или /find.'
    );
  });

  bot.on('message', async (ctx) => {
    if (isGroupChat(ctx.chat)) {
      if (!groupStore.getId()) groupStore.connectGroup(ctx.chat);
      return;
    }

    if (ctx.chat?.type !== 'private') return;

    const text = ctx.message.text?.trim();
    if (text?.startsWith('/')) return;

    const forwardToGroup = createSupportForwarder({
      telegram: ctx.telegram,
      getGroupId: () => groupStore.getId(),
    });

    const inSupport = supportSessions.has(ctx.from.id);
    const hasMedia = Boolean(ctx.message.photo?.length || ctx.message.document);

    try {
      if (inSupport || hasMedia) {
        await handleSupportMessage(ctx, {
          forwardToGroup,
          getGroupId: () => groupStore.getId(),
        });
        return;
      }

      if (text) {
        supportSessions.delete(ctx.from.id);
        await handleMedicineSearch(ctx, text, medicineApi);
        return;
      }

      await handleSupportMessage(ctx, {
        forwardToGroup,
        getGroupId: () => groupStore.getId(),
      });
    } catch (err) {
      console.error('Ошибка обработки сообщения:', err);
      await ctx.reply('Произошла ошибка. Попробуйте позже или напишите /support.');
    }
  });

  return bot;
}
