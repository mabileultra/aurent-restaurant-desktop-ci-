import {
  locationKeyboard,
  nearbyStoreButtons,
  nearbyStoreCardButtons,
  radiusButtons,
  errorButtons,
  mainMenuKeyboard,
} from '../keyboards/menus.js';
import {
  nearbyPromptText,
  formatNearbyList,
  formatNearbyStoreCard,
  needLocationText,
  genericErrorText,
} from '../texts/messages.js';
import { STATES, DEFAULT_RADIUS_KM } from '../state/userStateStore.js';

export async function promptNearby(ctx, deps) {
  const radius = deps.dataStore.getRadiusKm(ctx.from.id) || DEFAULT_RADIUS_KM;
  deps.stateStore.setState(ctx.from.id, STATES.REQUEST_LOCATION, {
    pendingAction: 'nearby',
    radiusKm: radius,
    nearbyStores: null,
  });
  await ctx.reply(nearbyPromptText(), {
    parse_mode: 'HTML',
    ...locationKeyboard(),
  });
}

export async function handleNearbyLocation(ctx, deps) {
  const loc = ctx.message.location;
  if (!loc) {
    await ctx.reply(needLocationText(), locationKeyboard());
    return;
  }
  deps.stateStore.set(ctx.from.id, {
    location: { lat: loc.latitude, lon: loc.longitude },
  });

  const savedRadius = deps.dataStore.getRadiusKm(ctx.from.id);
  if (savedRadius) {
    await showNearbyStores(ctx, deps, savedRadius);
    return;
  }

  deps.stateStore.setState(ctx.from.id, STATES.SELECT_RADIUS);
  await ctx.reply(
    [
      '📍 Радиус поиска',
      '',
      'На каком расстоянии искать аптеки?',
      '',
      `По умолчанию: ${DEFAULT_RADIUS_KM} км`,
    ].join('\n'),
    radiusButtons()
  );
}

export async function selectRadius(ctx, km, deps) {
  await ctx.answerCbQuery().catch(() => {});
  const radius = Number(km) || DEFAULT_RADIUS_KM;
  deps.dataStore.setRadiusKm(ctx.from.id, radius);
  deps.stateStore.set(ctx.from.id, { radiusKm: radius });
  await showNearbyStores(ctx, deps, radius);
}

export async function showNearbyStores(ctx, deps, radiusKm) {
  try {
    await ctx.replyWithChatAction('typing').catch(() => {});
    const stores = await deps.botApi.stores();
    const list = (stores || []).map((s) => ({ ...s }));
    deps.stateStore.setState(ctx.from.id, STATES.NEARBY_PHARMACIES, {
      nearbyStores: list,
      radiusKm: radiusKm || deps.stateStore.get(ctx.from.id).radiusKm,
    });
    if (!list.length) {
      await ctx.reply(
        '😔 Пока нет активных аптек в каталоге.\nДобавьте магазины с типом «Аптека» в CRM.',
        mainMenuKeyboard()
      );
      return;
    }
    await ctx.reply(formatNearbyList(list), {
      parse_mode: 'HTML',
      ...nearbyStoreButtons(list),
    });
  } catch (err) {
    console.error(err);
    await ctx.reply(genericErrorText(), errorButtons('nav:nearby'));
  }
}

export async function showNearbyStoreCard(ctx, storeId, deps) {
  await ctx.answerCbQuery().catch(() => {});
  const state = deps.stateStore.get(ctx.from.id);
  const stores = state.nearbyStores || [];
  const store = stores.find((s) => String(s.storeId) === String(storeId))
    || stores[Number(storeId)];
  if (!store) {
    await ctx.reply('Аптека не найдена.', errorButtons('nav:nearby'));
    return;
  }
  await ctx.reply(formatNearbyStoreCard(store), {
    parse_mode: 'HTML',
    ...nearbyStoreCardButtons(store),
  });
}

export async function remindLocation(ctx) {
  await ctx.reply(needLocationText(), locationKeyboard());
}
