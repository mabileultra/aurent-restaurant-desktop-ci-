import {
  productCardButtons,
  storeActionButtons,
} from '../keyboards/inlineKeyboards.js';
import { mainReplyKeyboard } from '../keyboards/replyKeyboards.js';
import {
  formatDescription,
  formatPriceCompare,
  formatProductCard,
  formatStoreAvailability,
  minPriceOf,
} from '../format/uiMessages.js';
import { findCachedProduct } from './searchFlow.js';

async function loadProduct(ctx, productId, { botApi, stateStore }) {
  const state = stateStore.get(ctx.from.id);
  let item = findCachedProduct(state, productId);
  if (!item) {
    item = await botApi.product(productId);
    stateStore.setState(ctx.from.id, state.state, {
      lastProductId: productId,
      lastSearch: {
        query: state.lastSearch?.query || item.productName,
        items: [item, ...(state.lastSearch?.items || []).filter((i) => i.productId !== productId)],
      },
    });
  } else {
    stateStore.setState(ctx.from.id, state.state, { lastProductId: productId });
  }
  return item;
}

export async function showProductCard(ctx, productId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  try {
    const item = await loadProduct(ctx, productId, deps);
    const favs = deps.dataStore.getFavorites(ctx.from.id);
    const isFavorite = favs.some((f) => f.productId === productId);
    await ctx.reply(formatProductCard(item), {
      parse_mode: 'HTML',
      ...productCardButtons(productId, { isFavorite }),
    });
  } catch (err) {
    console.error(err);
    await ctx.reply('Не удалось открыть карточку лекарства.');
  }
}

export async function showStoresForProduct(ctx, productId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  try {
    const item = await loadProduct(ctx, productId, deps);
    const matches = [...(item.matches || [])].sort((a, b) => Number(a.price) - Number(b.price));
    await ctx.reply(formatStoreAvailability(item), {
      parse_mode: 'HTML',
      ...storeActionButtons(matches),
    });
  } catch (err) {
    console.error(err);
    await ctx.reply('Не удалось загрузить аптеки.');
  }
}

export async function showPriceCompare(ctx, productId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  try {
    const item = await loadProduct(ctx, productId, deps);
    await ctx.reply(formatPriceCompare(item), {
      parse_mode: 'HTML',
      ...productCardButtons(productId),
    });
  } catch (err) {
    console.error(err);
    await ctx.reply('Не удалось сравнить цены.');
  }
}

export async function showDescription(ctx, productId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  try {
    const item = await loadProduct(ctx, productId, deps);
    await ctx.reply(formatDescription(item), {
      parse_mode: 'HTML',
      ...productCardButtons(productId),
    });
  } catch (err) {
    console.error(err);
    await ctx.reply('Описание недоступно.');
  }
}

export async function toggleFavorite(ctx, productId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  try {
    const item = await loadProduct(ctx, productId, deps);
    const favs = deps.dataStore.getFavorites(ctx.from.id);
    const exists = favs.some((f) => f.productId === productId);
    if (exists) {
      deps.dataStore.removeFavorite(ctx.from.id, productId);
      await ctx.reply('Удалено из избранного.');
    } else {
      deps.dataStore.addFavorite(ctx.from.id, {
        productId,
        productName: item.productName,
        minPrice: minPriceOf(item),
      });
      await ctx.reply('⭐ Добавлено в избранное.');
    }
  } catch (err) {
    console.error(err);
    await ctx.reply('Не удалось обновить избранное.');
  }
}

export async function handleBookStub(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  await ctx.reply(
    '📦 Бронирование скоро появится.\nПока позвоните в аптеку или напишите в поддержку — поможем уточнить наличие.',
    mainReplyKeyboard()
  );
}
