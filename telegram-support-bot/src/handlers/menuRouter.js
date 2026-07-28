import { mainReplyKeyboard } from '../keyboards/replyKeyboards.js';
import { welcomeText } from '../format/uiMessages.js';
import { MENU, STATES } from '../state/userStateStore.js';
import { promptSearch, runMedicineSearch } from './searchFlow.js';
import {
  clearHistory,
  promptNearby,
  removeFavorite,
  repeatHistory,
  showFavorites,
  showHistory,
  showNearbyStores,
  toggleWatch,
} from './nearbyFavoritesHistory.js';
import {
  appendOrCreateSupport,
  closeTicket,
  prepareTicketAppend,
  selectSupportCategory,
  showSupportCategories,
  showTicketStatus,
} from './supportFlow.js';
import {
  handleBookStub,
  showDescription,
  showPriceCompare,
  showProductCard,
  showStoresForProduct,
  toggleFavorite,
} from './productFlow.js';
import { formatSearchResults } from '../format/uiMessages.js';
import { searchResultButtons } from '../keyboards/inlineKeyboards.js';

export async function showMainMenu(ctx, stateStore) {
  stateStore.resetToMain(ctx.from.id);
  await ctx.reply(welcomeText(ctx.from.first_name), {
    parse_mode: 'HTML',
    ...mainReplyKeyboard(),
  });
}

export async function showAbout(ctx, stateStore) {
  stateStore.resetToMain(ctx.from.id);
  await ctx.reply(
    [
      'ℹ️ <b>О сервисе Aurent</b>',
      '',
      'Поиск лекарств по аптекам сети: цена, остаток, контакты.',
      '',
      'Команды: /start /find /nearby /favorites /history /support /help',
    ].join('\n'),
    { parse_mode: 'HTML', ...mainReplyKeyboard() }
  );
}

export async function handleMenuText(ctx, text, deps) {
  const { stateStore, dataStore } = deps;

  if (text === MENU.HOME || text === '/start') {
    await showMainMenu(ctx, stateStore);
    return true;
  }
  if (text === MENU.FIND) {
    await promptSearch(ctx, stateStore);
    return true;
  }
  if (text === MENU.NEARBY) {
    await promptNearby(ctx, stateStore);
    return true;
  }
  if (text === MENU.FAVORITES) {
    await showFavorites(ctx, deps);
    return true;
  }
  if (text === MENU.HISTORY) {
    await showHistory(ctx, deps);
    return true;
  }
  if (text === MENU.SUPPORT) {
    await showSupportCategories(ctx, stateStore);
    return true;
  }
  if (text === MENU.ABOUT) {
    await showAbout(ctx, stateStore);
    return true;
  }
  if (text === MENU.SCAN) {
    stateStore.setState(ctx.from.id, STATES.SEARCH_WAIT_QUERY);
    await ctx.reply(
      '📷 Отправьте штрихкод цифрами в сообщении.\nСканирование с камеры в Telegram-боте пока недоступно — введите код вручную.'
    );
    return true;
  }
  if (text === MENU.LAST_QUERIES) {
    const history = dataStore.getHistory(ctx.from.id).slice(0, 5);
    if (!history.length) {
      await ctx.reply('Пока нет последних запросов.');
      return true;
    }
    await ctx.reply(
      `Последние запросы:\n${history.map((h, i) => `${i + 1}. ${h.query}`).join('\n')}\n\nНапишите название снова или выберите из истории (/history).`
    );
    return true;
  }
  return false;
}

export async function handleCallback(ctx, deps) {
  const data = ctx.callbackQuery?.data || '';
  const [action, payload] = data.split(':');

  switch (action) {
    case 'prod':
      return showProductCard(ctx, payload, deps);
    case 'stores':
      return showStoresForProduct(ctx, payload, deps);
    case 'prices':
      return showPriceCompare(ctx, payload, deps);
    case 'desc':
      return showDescription(ctx, payload, deps);
    case 'fav':
      return toggleFavorite(ctx, payload, deps);
    case 'unfav':
      return removeFavorite(ctx, payload, deps);
    case 'watch':
      return toggleWatch(ctx, payload, deps);
    case 'book':
      return handleBookStub(ctx);
    case 'sup':
      return selectSupportCategory(ctx, payload, deps.stateStore);
    case 'tstat':
      return showTicketStatus(ctx, payload, deps);
    case 'tadd':
      return prepareTicketAppend(ctx, payload, deps.stateStore);
    case 'tclose':
      return closeTicket(ctx, payload, deps);
    case 'hist':
      if (payload === 'clear') return clearHistory(ctx, deps);
      return repeatHistory(ctx, payload, deps);
    case 'back':
      await ctx.answerCbQuery().catch(() => {});
      if (payload === 'search') {
        const state = deps.stateStore.get(ctx.from.id);
        if (state.lastSearch) {
          await ctx.reply(formatSearchResults(state.lastSearch), {
            parse_mode: 'HTML',
            ...searchResultButtons(state.lastSearch.items || []),
          });
        } else {
          await promptSearch(ctx, deps.stateStore);
        }
      }
      return;
    case 'nav':
      await ctx.answerCbQuery().catch(() => {});
      if (payload === 'home') await showMainMenu(ctx, deps.stateStore);
      return;
    case 'near':
      await ctx.answerCbQuery().catch(() => {});
      return showNearbyStores(ctx, deps);
    default:
      await ctx.answerCbQuery().catch(() => {});
  }
}

export async function handlePrivateMessage(ctx, deps) {
  const text = ctx.message.text?.trim();
  const state = deps.stateStore.get(ctx.from.id);

  if (text && await handleMenuText(ctx, text, deps)) {
    return;
  }

  if (ctx.message.location || text === MENU.SEND_LOCATION) {
    await showNearbyStores(ctx, deps);
    return;
  }

  if (state.state === STATES.SUPPORT_MESSAGE) {
    await appendOrCreateSupport(ctx, deps);
    return;
  }

  if (state.state === STATES.SUPPORT_ACTIVE) {
    if (text) {
      await ctx.reply(
        'У вас есть открытое обращение.\nНажмите «➕ Дополнить обращение», «🏠 Главное меню» или «🔍 Найти лекарство».'
      );
      return;
    }
    await appendOrCreateSupport(ctx, deps);
    return;
  }

  if (state.state === STATES.SUPPORT_CATEGORY) {
    await ctx.reply('Выберите категорию кнопкой выше или нажмите «Главное меню».');
    return;
  }

  if (state.state === STATES.NEARBY_WAIT_LOCATION) {
    await ctx.reply('Отправьте геолокацию кнопкой ниже или откройте «Главное меню».');
    return;
  }

  if (state.state === STATES.SEARCH_WAIT_QUERY || state.state === STATES.MAIN) {
    if (text) {
      await runMedicineSearch(ctx, text, deps);
      return;
    }
  }

  if (ctx.message.photo || ctx.message.document) {
    await showSupportCategories(ctx, deps.stateStore);
    await ctx.reply('Чтобы отправить файл в поддержку, выберите категорию и затем пришлите файл ещё раз.');
    return;
  }

  await showMainMenu(ctx, deps.stateStore);
}
