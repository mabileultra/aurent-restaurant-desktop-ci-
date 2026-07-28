import { searchResultButtons } from '../keyboards/inlineKeyboards.js';
import { searchReplyKeyboard } from '../keyboards/replyKeyboards.js';
import {
  formatSearchResults,
  searchPromptText,
} from '../format/uiMessages.js';
import { STATES } from '../state/userStateStore.js';

export async function promptSearch(ctx, stateStore) {
  stateStore.setState(ctx.from.id, STATES.SEARCH_WAIT_QUERY);
  await ctx.reply(searchPromptText(), searchReplyKeyboard());
}

export async function runMedicineSearch(ctx, query, { botApi, stateStore, dataStore }) {
  const q = String(query || '').trim();
  if (q.length < 2) {
    await ctx.reply('Введите минимум 2 символа.\nПример: Парацетамол');
    return;
  }

  await ctx.replyWithChatAction('typing');
  try {
    const data = await botApi.search(q);
    dataStore.addHistory(ctx.from.id, q);
    stateStore.setState(ctx.from.id, STATES.SEARCH_WAIT_QUERY, {
      lastSearch: data,
      lastProductId: null,
    });

    const text = formatSearchResults(data);
    if (!data.items?.length) {
      await ctx.reply(text, searchReplyKeyboard());
      return;
    }
    await ctx.reply(text, {
      parse_mode: 'HTML',
      ...searchResultButtons(data.items),
    });
  } catch (err) {
    console.error('Medicine search error:', err);
    if (err.code === 'BOT_API_NOT_CONFIGURED') {
      await ctx.reply('Поиск пока не настроен. Напишите в поддержку.');
      return;
    }
    await ctx.reply(err.message ? `Не удалось найти: ${err.message}` : 'Сервис поиска временно недоступен.');
  }
}

export function findCachedProduct(state, productId) {
  const items = state?.lastSearch?.items || [];
  return items.find((i) => i.productId === productId) || null;
}
