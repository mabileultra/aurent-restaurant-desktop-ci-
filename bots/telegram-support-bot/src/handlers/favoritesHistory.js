import { favoritesButtons, historyButtons, mainMenuKeyboard } from '../keyboards/menus.js';
import {
  favoritesEmptyText,
  favoritesListText,
  historyEmptyText,
  historyListText,
} from '../texts/messages.js';
import { STATES } from '../state/userStateStore.js';
import { runMedicineSearch } from './searchFlow.js';

export async function showFavorites(ctx, deps) {
  deps.stateStore.setState(ctx.from.id, STATES.FAVORITES);
  const favorites = deps.dataStore.getFavorites(ctx.from.id);
  if (!favorites.length) {
    await ctx.reply(favoritesEmptyText(), mainMenuKeyboard());
    return;
  }
  await ctx.reply(favoritesListText(favorites), {
    parse_mode: 'HTML',
    ...favoritesButtons(favorites),
  });
}

export async function showHistory(ctx, deps) {
  deps.stateStore.setState(ctx.from.id, STATES.SEARCH_HISTORY);
  const history = deps.dataStore.getHistory(ctx.from.id);
  if (!history.length) {
    await ctx.reply(historyEmptyText(), mainMenuKeyboard());
    return;
  }
  await ctx.reply(historyListText(history), {
    parse_mode: 'HTML',
    ...historyButtons(history),
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
  await ctx.reply('🗑 История очищена.', mainMenuKeyboard());
  deps.stateStore.resetToMain(ctx.from.id);
}
