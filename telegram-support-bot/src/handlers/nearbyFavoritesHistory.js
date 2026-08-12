import { favoritesButtons, historyButtons, nearbyListButtons } from '../keyboards/inlineKeyboards.js';
import { nearbyReplyKeyboard, mainReplyKeyboard } from '../keyboards/replyKeyboards.js';
import {
  formatFavorites,
  formatHistory,
  formatStoresNearby,
} from '../format/uiMessages.js';
import { STATES } from '../state/userStateStore.js';
import { promptSearch, runMedicineSearch } from './searchFlow.js';

export async function promptNearby(ctx, stateStore) {
  stateStore.setState(ctx.from.id, STATES.NEARBY_WAIT_LOCATION);
    await ctx.reply(
    'Отправьте геолокацию, чтобы найти аптеки этой сети.\n\nПока координаты магазинов не заполнены — покажу список аптек компании.',
    nearbyReplyKeyboard()
  );
}

export async function showNearbyStores(ctx, { botApi, stateStore }) {
  stateStore.resetToMain(ctx.from.id);
  try {
    const stores = await botApi.stores();
    await ctx.reply(formatStoresNearby(stores), {
      parse_mode: 'HTML',
      ...nearbyListButtons(),
    });
    await ctx.reply('Выберите действие в меню ниже:', mainReplyKeyboard());
  } catch (err) {
    console.error(err);
    await ctx.reply('Не удалось загрузить список аптек.', mainReplyKeyboard());
  }
}

export async function showFavorites(ctx, { dataStore, stateStore }) {
  stateStore.resetToMain(ctx.from.id);
  const favorites = dataStore.getFavorites(ctx.from.id);
  await ctx.reply(formatFavorites(favorites), {
    parse_mode: 'HTML',
    ...(favorites.length ? favoritesButtons(favorites) : mainReplyKeyboard()),
  });
}

export async function showHistory(ctx, { dataStore, stateStore }) {
  stateStore.resetToMain(ctx.from.id);
  const history = dataStore.getHistory(ctx.from.id);
  await ctx.reply(formatHistory(history), {
    parse_mode: 'HTML',
    ...(history.length ? historyButtons(history) : mainReplyKeyboard()),
  });
}

export async function repeatHistory(ctx, index, deps) {
  await ctx.answerCbQuery().catch(() => {});
  const history = deps.dataStore.getHistory(ctx.from.id);
  const item = history[Number(index)];
  if (!item) {
    await ctx.reply('Запрос не найден в истории.');
    return;
  }
  await runMedicineSearch(ctx, item.query, deps);
}

export async function clearHistory(ctx, deps) {
  await ctx.answerCbQuery().catch(() => {});
  deps.dataStore.clearHistory(ctx.from.id);
  await ctx.reply('История очищена.', mainReplyKeyboard());
}

export async function toggleWatch(ctx, productId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  const fav = deps.dataStore.toggleWatch(ctx.from.id, productId);
  if (!fav) {
    await ctx.reply('Сначала добавьте лекарство в избранное.');
    return;
  }
  await ctx.reply(
    fav.watchPrice
      ? '🔔 Слежение за ценой включено. Уведомления появятся в следующем обновлении сервиса.'
      : 'Слежение за ценой выключено.'
  );
}

export async function removeFavorite(ctx, productId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  deps.dataStore.removeFavorite(ctx.from.id, productId);
  await ctx.reply('Удалено из избранного.');
  await showFavorites(ctx, deps);
}
