/**
 * Чистые правила offline/online для кассы (без zustand/DOM).
 * Маршрутизация POS — в posRouteResolver.js + posDataRouter.js.
 */

export function catalogMatchesStore(catalogStoreId, requestedStoreId) {
  if (requestedStoreId == null || catalogStoreId == null) return false;
  return Number(catalogStoreId) === Number(requestedStoreId);
}

export function hasLocalPosCatalog(state, storeId) {
  if (!state) return false;
  if (!Boolean(state.bootstrapReady || state.canSellOffline || state.productCount > 0)) {
    return false;
  }
  return catalogMatchesStore(state.storeId, storeId);
}

export function isConnectivityOfflineLike(state) {
  const browserOffline =
    typeof navigator !== 'undefined' && navigator.onLine === false;
  return Boolean(
    state?.forceOfflineMode ||
      state?.offlineMode ||
      !state?.apiOnline ||
      browserOffline,
  );
}

export function isCatalogStoreMismatch(catalogStoreId, requestedStoreId) {
  if (catalogStoreId == null || requestedStoreId == null) return false;
  return Number(catalogStoreId) !== Number(requestedStoreId);
}

/** Контекст для posRouteResolver и тестов. */
export function buildConnectivityContext({
  isDesktop,
  offlineAllowed,
  state,
  storeId = null,
}) {
  const offlineLike = isConnectivityOfflineLike(state);
  return {
    isDesktop: Boolean(isDesktop),
    offlineAllowed: Boolean(offlineAllowed),
    offlineLike,
    state,
    storeId,
    apiOnline: state?.apiOnline,
    offlineMode: state?.offlineMode,
    forceOfflineMode: state?.forceOfflineMode,
  };
}

/** @deprecated только для verify-offline-connectivity.mjs */
export function shouldPreferLocalCheckout({
  isDesktop,
  offlineAllowed,
  offlineLike,
  state,
  storeId,
}) {
  if (!isDesktop || !offlineAllowed) return false;
  const effectiveOfflineLike =
    offlineLike !== undefined && offlineLike !== null
      ? offlineLike
      : isConnectivityOfflineLike(state);
  if (!effectiveOfflineLike) return false;
  return hasLocalPosCatalog(state, storeId);
}

/** @deprecated только для verify-offline-connectivity.mjs */
export function canFallbackToOfflineCheckout({ isDesktop, offlineAllowed, state, storeId }) {
  if (!isDesktop || !offlineAllowed) return false;
  return hasLocalPosCatalog(state, storeId);
}

/** @deprecated только для verify-offline-connectivity.mjs */
export function shouldRetryOnlineAfterOfflineFailure(offlineErr, ctx) {
  const msg = String(offlineErr?.message || '');
  const NO_RETRY = new Set([
    'offline_ipc_timeout',
    'offline_checkout_timeout',
    'OFFLINE_SALE_SAVE_FAILED',
    'offline_sale_save_failed',
    'OFFLINE_SHIFT_REQUIRED',
  ]);
  if (NO_RETRY.has(msg)) return false;
  if (ctx.offlineLike) return false;
  if (
    shouldPreferLocalCheckout({
      isDesktop: ctx.isDesktop,
      offlineAllowed: ctx.offlineAllowed,
      offlineLike: ctx.offlineLike,
      state: ctx.state,
      storeId: ctx.storeId,
    })
  ) {
    return false;
  }
  return Boolean(ctx.apiOnline && !ctx.offlineMode);
}
