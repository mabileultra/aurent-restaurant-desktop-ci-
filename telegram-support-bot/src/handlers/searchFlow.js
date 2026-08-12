import {
  searchResultButtons,
  notFoundButtons,
  homeKeyboard,
  errorButtons,
} from '../keyboards/menus.js';
import {
  searchPromptText,
  formatSearchResults,
  notFoundText,
  needMedicineNameText,
  genericErrorText,
} from '../texts/messages.js';
import { STATES } from '../state/userStateStore.js';

export async function promptSearch(ctx, stateStore) {
  stateStore.setState(ctx.from.id, STATES.SEARCH_MEDICINE, {
    lastProductId: null,
    pharmacyMatches: null,
  });
  await ctx.reply(searchPromptText(), {
    parse_mode: 'HTML',
    ...homeKeyboard(),
  });
}

export function normalizeQuery(raw) {
  return String(raw || '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function runMedicineSearch(ctx, query, deps) {
  const { botApi, stateStore, dataStore } = deps;
  const q = normalizeQuery(query);
  if (q.length < 2) {
    await ctx.reply(needMedicineNameText());
    return;
  }

  await ctx.replyWithChatAction('typing').catch(() => {});
  try {
    const data = await botApi.search(q);
    dataStore.addHistory(ctx.from.id, q);

    if (!data.items?.length) {
      stateStore.setState(ctx.from.id, STATES.SEARCH_MEDICINE, { lastSearch: data });
      await ctx.reply(notFoundText(q), {
        parse_mode: 'HTML',
        ...notFoundButtons(),
      });
      return;
    }

    stateStore.setState(ctx.from.id, STATES.SEARCH_MEDICINE_RESULTS, {
      lastSearch: data,
      lastProductId: null,
    });

    await ctx.reply(formatSearchResults(data), {
      parse_mode: 'HTML',
      ...searchResultButtons(data.items),
    });
  } catch (err) {
    console.error('Medicine search error:', err);
    stateStore.setState(ctx.from.id, STATES.SEARCH_MEDICINE);
    const retry = 'nav:search_prompt';
    if (err.code === 'BOT_API_NOT_CONFIGURED') {
      await ctx.reply('Поиск временно недоступен. Напишите в поддержку.', errorButtons('nav:support'));
      return;
    }
    await ctx.reply(genericErrorText(), errorButtons(retry));
  }
}

export function findCachedProduct(state, productId) {
  const items = state?.lastSearch?.items || [];
  return items.find((i) => String(i.productId) === String(productId)) || null;
}
