import { MENU, STATES } from '../state/userStateStore.js';
import { showMainMenu, showAbout } from './mainMenu.js';
import { promptSearch, runMedicineSearch } from './searchFlow.js';
import {
  showProductCard,
  askLocationForProduct,
  showStoresForProduct,
  showPharmacyCard,
  toggleFavorite,
  removeFavorite,
  handleLocationInProductSearch,
} from './productFlow.js';
import {
  promptNearby,
  handleNearbyLocation,
  selectRadius,
  showNearbyStores,
  showNearbyStoreCard,
  remindLocation,
} from './nearbyFlow.js';
import {
  showFavorites,
  showHistory,
  repeatHistory,
  clearHistory,
} from './favoritesHistory.js';
import { promptBarcode, handleBarcodeInput } from './barcodeFlow.js';
import {
  showSupportMenu,
  selectSupportCategory,
  appendOrCreateSupport,
  showTicketStatus,
  prepareTicketAppend,
  closeTicket,
} from './supportFlow.js';
import { genericErrorText, needMedicineNameText } from '../texts/messages.js';
import { errorButtons, mainMenuKeyboard } from '../keyboards/menus.js';

export async function handleMenuText(ctx, text, deps) {
  const { stateStore } = deps;

  if (text === MENU.HOME) {
    await showMainMenu(ctx, stateStore);
    return true;
  }
  if (text === MENU.BACK) {
    await handleBack(ctx, deps);
    return true;
  }
  if (text === MENU.FIND) {
    await promptSearch(ctx, stateStore);
    return true;
  }
  if (text === MENU.NEARBY) {
    await promptNearby(ctx, deps);
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
  if (text === MENU.SCAN) {
    await promptBarcode(ctx, stateStore);
    return true;
  }
  if (text === MENU.SUPPORT) {
    await showSupportMenu(ctx, stateStore);
    return true;
  }
  if (text === MENU.ABOUT) {
    await showAbout(ctx, stateStore);
    return true;
  }
  return false;
}

async function handleBack(ctx, deps) {
  const state = deps.stateStore.get(ctx.from.id);
  switch (state.state) {
    case STATES.SEARCH_MEDICINE_RESULTS:
    case STATES.SELECT_MEDICINE:
      await promptSearch(ctx, deps.stateStore);
      return;
    case STATES.SEARCH_PHARMACIES:
    case STATES.SELECT_PHARMACY:
      if (state.lastProductId) {
        await showProductCard(ctx, state.lastProductId, deps);
        return;
      }
      await promptSearch(ctx, deps.stateStore);
      return;
    case STATES.REQUEST_LOCATION:
    case STATES.SELECT_RADIUS:
    case STATES.NEARBY_PHARMACIES:
      await showMainMenu(ctx, deps.stateStore);
      return;
    case STATES.SUPPORT_WAITING_MESSAGE:
      await showSupportMenu(ctx, deps.stateStore);
      return;
    default:
      await showMainMenu(ctx, deps.stateStore);
  }
}

export async function handleCallback(ctx, deps) {
  const data = ctx.callbackQuery?.data || '';
  const [action, payload, extra] = data.split(':');

  try {
    switch (action) {
      case 'nav':
        await ctx.answerCbQuery().catch(() => {});
        if (payload === 'home') return showMainMenu(ctx, deps.stateStore);
        if (payload === 'search_prompt') return promptSearch(ctx, deps.stateStore);
        if (payload === 'barcode') return promptBarcode(ctx, deps.stateStore);
        if (payload === 'support') return showSupportMenu(ctx, deps.stateStore);
        if (payload === 'nearby') return promptNearby(ctx, deps);
        if (payload === 'nearby_list') {
          const stores = deps.stateStore.get(ctx.from.id).nearbyStores || [];
          if (!stores.length) return promptNearby(ctx, deps);
          return showNearbyStores(ctx, deps);
        }
        return;
      case 'prod':
        return showProductCard(ctx, payload, deps);
      case 'stores':
        // Сначала просим гео, если ещё нет; иначе сразу список
        if (!deps.stateStore.get(ctx.from.id).location) {
          return askLocationForProduct(ctx, payload, deps);
        }
        await ctx.answerCbQuery().catch(() => {});
        return showStoresForProduct(ctx, payload, deps, { fromLocation: true });
      case 'pharm':
        return showPharmacyCard(ctx, payload, extra, deps);
      case 'fav':
        return toggleFavorite(ctx, payload, deps);
      case 'unfav':
        await removeFavorite(ctx, payload, deps);
        return showFavorites(ctx, deps);
      case 'hist':
        if (payload === 'clear') return clearHistory(ctx, deps);
        return repeatHistory(ctx, payload, deps);
      case 'sup':
        return selectSupportCategory(ctx, payload, deps.stateStore);
      case 'tstat':
        return showTicketStatus(ctx, payload, deps);
      case 'tadd':
        return prepareTicketAppend(ctx, payload, deps.stateStore);
      case 'tclose':
        return closeTicket(ctx, payload, deps);
      case 'radius':
        return selectRadius(ctx, payload, deps);
      case 'nstore':
        return showNearbyStoreCard(ctx, payload, deps);
      case 'back':
        await ctx.answerCbQuery().catch(() => {});
        if (payload === 'search') {
          const state = deps.stateStore.get(ctx.from.id);
          if (state.lastSearch?.items?.length) {
            const { formatSearchResults } = await import('../texts/messages.js');
            const { searchResultButtons } = await import('../keyboards/menus.js');
            deps.stateStore.setState(ctx.from.id, STATES.SEARCH_MEDICINE_RESULTS);
            await ctx.reply(formatSearchResults(state.lastSearch), {
              parse_mode: 'HTML',
              ...searchResultButtons(state.lastSearch.items),
            });
            return;
          }
          return promptSearch(ctx, deps.stateStore);
        }
        return;
      default:
        await ctx.answerCbQuery().catch(() => {});
    }
  } catch (err) {
    console.error('callback error:', err);
    await ctx.answerCbQuery('Ошибка').catch(() => {});
    await ctx.reply(genericErrorText(), errorButtons('nav:home'));
  }
}

export async function handlePrivateMessage(ctx, deps) {
  const text = ctx.message.text?.trim();
  const state = deps.stateStore.get(ctx.from.id);

  if (text && (await handleMenuText(ctx, text, deps))) {
    return;
  }

  // Геолокация
  if (ctx.message.location || text === MENU.SEND_LOCATION) {
    if (state.state === STATES.SEARCH_PHARMACIES && state.lastProductId) {
      await handleLocationInProductSearch(ctx, deps);
      return;
    }
    if (
      state.state === STATES.REQUEST_LOCATION
      || state.state === STATES.NEARBY_PHARMACIES
      || state.state === STATES.SELECT_RADIUS
      || state.pendingAction === 'nearby'
    ) {
      await handleNearbyLocation(ctx, deps);
      return;
    }
    await remindLocation(ctx);
    return;
  }

  // Поддержка
  if (
    state.state === STATES.SUPPORT_WAITING_MESSAGE
    || (state.state === STATES.SUPPORT_ACTIVE && (ctx.message.photo || ctx.message.document))
  ) {
    if (state.state === STATES.SUPPORT_ACTIVE && text) {
      await ctx.reply(
        'У вас есть открытое обращение.\nНажмите «➕ Дополнить» или «🏠 Главное меню».'
      );
      return;
    }
    await appendOrCreateSupport(ctx, deps);
    return;
  }

  if (state.state === STATES.SUPPORT_MENU) {
    await ctx.reply('Выберите категорию кнопкой выше или «🏠 Главное меню».');
    return;
  }

  // Штрихкод
  if (state.state === STATES.BARCODE_WAITING) {
    await handleBarcodeInput(ctx, deps);
    return;
  }

  // Ожидание гео
  if (state.state === STATES.REQUEST_LOCATION || state.state === STATES.SEARCH_PHARMACIES) {
    await remindLocation(ctx);
    return;
  }

  if (state.state === STATES.SELECT_RADIUS) {
    await ctx.reply('Выберите радиус кнопкой выше.');
    return;
  }

  // Поиск
  if (
    state.state === STATES.SEARCH_MEDICINE
    || state.state === STATES.SEARCH_MEDICINE_RESULTS
    || state.state === STATES.MAIN_MENU
  ) {
    if (text) {
      if (state.state === STATES.MAIN_MENU) {
        // из главного меню текст = сразу поиск
      }
      await runMedicineSearch(ctx, text, deps);
      return;
    }
    if (state.state === STATES.SEARCH_MEDICINE) {
      await ctx.reply(needMedicineNameText());
      return;
    }
  }

  if (ctx.message.photo || ctx.message.document) {
    await promptBarcode(ctx, deps.stateStore);
    await ctx.reply('Если это штрихкод — отправьте ещё раз или введите цифры.');
    return;
  }

  await showMainMenu(ctx, deps.stateStore);
}
