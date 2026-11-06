import {
  productCardButtons,
  pharmacyListButtons,
  pharmacyCardButtons,
  locationKeyboard,
  errorButtons,
} from '../keyboards/menus.js';
import {
  formatProductCard,
  formatPharmacyResults,
  formatPharmacyCard,
  minPriceOf,
  genericErrorText,
  needLocationText,
} from '../texts/messages.js';
import { STATES } from '../state/userStateStore.js';
import { findCachedProduct } from './searchFlow.js';

async function loadProduct(ctx, productId, deps) {
  const { botApi, stateStore } = deps;
  const state = stateStore.get(ctx.from.id);
  let item = findCachedProduct(state, productId);
  if (!item) {
    item = await botApi.product(productId);
  }
  stateStore.set(ctx.from.id, {
    lastProductId: productId,
    lastProduct: item,
    lastSearch: {
      query: state.lastSearch?.query || item.productName,
      items: [
        item,
        ...(state.lastSearch?.items || []).filter((i) => String(i.productId) !== String(productId)),
      ],
    },
  });
  return item;
}

export async function showProductCard(ctx, productId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  try {
    const item = await loadProduct(ctx, productId, deps);
    deps.stateStore.setState(ctx.from.id, STATES.SELECT_MEDICINE, { lastProductId: productId });
    const favs = deps.dataStore.getFavorites(ctx.from.id);
    const isFavorite = favs.some((f) => String(f.productId) === String(productId));
    await ctx.reply(formatProductCard(item), {
      parse_mode: 'HTML',
      ...productCardButtons(productId, { isFavorite }),
    });
  } catch (err) {
    console.error(err);
    await ctx.reply(genericErrorText(), errorButtons(`prod:${productId}`));
  }
}

export async function askLocationForProduct(ctx, productId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  try {
    await loadProduct(ctx, productId, deps);
    deps.stateStore.setState(ctx.from.id, STATES.SEARCH_PHARMACIES, {
      lastProductId: productId,
      pendingAction: 'product_pharmacies',
    });
    await ctx.reply(
      [
        '📍 Чтобы найти препарат рядом с вами,',
        'отправьте своё местоположение.',
        '',
        'Это позволит показать:',
        '• ближайшие аптеки;',
        '• наличие;',
        '• цену.',
      ].join('\n'),
      locationKeyboard()
    );
  } catch (err) {
    console.error(err);
    await ctx.reply(genericErrorText(), errorButtons(`stores:${productId}`));
  }
}

/** Показать аптеки по препарату (с гео или без). */
export async function showStoresForProduct(ctx, productId, deps, { fromLocation = false } = {}) {
  try {
    const item = await loadProduct(ctx, productId, deps);
    let matches = [...(item.matches || [])].filter((m) => m.storeId != null || m.storeName);

    matches.sort((a, b) => {
      const stockA = Number(a.stockQuantity) > 0 ? 0 : 1;
      const stockB = Number(b.stockQuantity) > 0 ? 0 : 1;
      if (stockA !== stockB) return stockA - stockB;
      return Number(a.price ?? Infinity) - Number(b.price ?? Infinity);
    });

    // Гео есть, но координат аптек в API пока нет — честно показываем список
    if (fromLocation) {
      matches = matches.map((m) => ({ ...m }));
    }

    deps.stateStore.setState(ctx.from.id, STATES.SELECT_PHARMACY, {
      lastProductId: productId,
      pharmacyMatches: matches,
    });

    if (!matches.length) {
      await ctx.reply(
        '😔 В аптеках пока нет данных по этому препарату.\nПопробуйте другое название или напишите в поддержку.',
        errorButtons('nav:support')
      );
      return;
    }

    await ctx.reply(formatPharmacyResults(item, matches), {
      parse_mode: 'HTML',
      ...pharmacyListButtons(matches, productId),
    });
  } catch (err) {
    console.error(err);
    await ctx.reply(genericErrorText(), errorButtons(`stores:${productId}`));
  }
}

export async function showPharmacyCard(ctx, productId, storeId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  try {
    const state = deps.stateStore.get(ctx.from.id);
    const item = state.lastProduct || (await loadProduct(ctx, productId, deps));
    const matches = state.pharmacyMatches || item.matches || [];
    const store = matches.find((m) => String(m.storeId) === String(storeId))
      || matches[Number(storeId)];
    if (!store) {
      await ctx.reply('Аптека не найдена.', errorButtons(`stores:${productId}`));
      return;
    }
    deps.stateStore.setState(ctx.from.id, STATES.SELECT_PHARMACY, {
      selectedStoreId: store.storeId,
    });
    await ctx.reply(formatPharmacyCard(item, store), {
      parse_mode: 'HTML',
      ...pharmacyCardButtons(productId, store),
    });
  } catch (err) {
    console.error(err);
    await ctx.reply(genericErrorText(), errorButtons(`stores:${productId}`));
  }
}

export async function toggleFavorite(ctx, productId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  try {
    const item = await loadProduct(ctx, productId, deps);
    const favs = deps.dataStore.getFavorites(ctx.from.id);
    const exists = favs.some((f) => String(f.productId) === String(productId));
    if (exists) {
      await ctx.reply('Уже в избранном.');
      return;
    }
    deps.dataStore.addFavorite(ctx.from.id, {
      productId,
      productName: item.productName,
      minPrice: minPriceOf(item),
    });
    await ctx.reply('⭐ Добавлено в избранное.', productCardButtons(productId, { isFavorite: true }));
  } catch (err) {
    console.error(err);
    await ctx.reply(genericErrorText(), errorButtons(`prod:${productId}`));
  }
}

export async function removeFavorite(ctx, productId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  deps.dataStore.removeFavorite(ctx.from.id, productId);
  await ctx.reply('Удалено из избранного.');
}

export async function handleLocationInProductSearch(ctx, deps) {
  const state = deps.stateStore.get(ctx.from.id);
  if (state.state !== STATES.SEARCH_PHARMACIES || !state.lastProductId) {
    await ctx.reply(needLocationText());
    return;
  }
  const loc = ctx.message.location;
  deps.stateStore.set(ctx.from.id, {
    location: { lat: loc.latitude, lon: loc.longitude },
  });
  deps.dataStore.setRadiusKm?.(ctx.from.id, state.radiusKm || deps.dataStore.getRadiusKm(ctx.from.id));
  await showStoresForProduct(ctx, state.lastProductId, deps, { fromLocation: true });
}
