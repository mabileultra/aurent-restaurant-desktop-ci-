/** FSM-состояния пользователя (Telegram user id). */
export const STATES = {
  MAIN_MENU: 'MAIN_MENU',

  SEARCH_MEDICINE: 'SEARCH_MEDICINE',
  SEARCH_MEDICINE_RESULTS: 'SEARCH_MEDICINE_RESULTS',
  SELECT_MEDICINE: 'SELECT_MEDICINE',
  SEARCH_PHARMACIES: 'SEARCH_PHARMACIES',
  SELECT_PHARMACY: 'SELECT_PHARMACY',

  NEARBY_PHARMACIES: 'NEARBY_PHARMACIES',
  REQUEST_LOCATION: 'REQUEST_LOCATION',
  SELECT_RADIUS: 'SELECT_RADIUS',

  FAVORITES: 'FAVORITES',
  SEARCH_HISTORY: 'SEARCH_HISTORY',

  SUPPORT_MENU: 'SUPPORT_MENU',
  SUPPORT_WAITING_MESSAGE: 'SUPPORT_WAITING_MESSAGE',
  SUPPORT_ACTIVE: 'SUPPORT_ACTIVE',

  BARCODE_WAITING: 'BARCODE_WAITING',
  BARCODE_RESULT: 'BARCODE_RESULT',

  ABOUT: 'ABOUT',
};

/** Единый стиль reply-кнопок (ТЗ §2, §24). */
export const MENU = {
  FIND: '🔎 Найти лекарство',
  NEARBY: '📍 Аптеки рядом',
  FAVORITES: '⭐ Избранное',
  HISTORY: '🕘 История поиска',
  SCAN: '📷 Сканировать штрихкод',
  SUPPORT: '🆘 Поддержка',
  ABOUT: 'ℹ️ О сервисе',
  HOME: '🏠 Главное меню',
  BACK: '⬅️ Назад',
  SEND_LOCATION: '📍 Отправить моё местоположение',
  RETRY: '🔄 Повторить',
  CANCEL: '❌ Отмена',
};

export const DEFAULT_RADIUS_KM = 5;
export const RADIUS_OPTIONS_KM = [1, 3, 5, 10];
export const HISTORY_LIMIT = 30;
export const FAVORITES_LIMIT = 50;

/**
 * In-memory FSM на userId. Без глобальных переменных сценария.
 */
export function createUserStateStore() {
  /** @type {Map<number, object>} */
  const map = new Map();

  function blank() {
    return {
      state: STATES.MAIN_MENU,
      stack: [],
      lastSearch: null,
      lastProductId: null,
      lastProduct: null,
      pharmacyMatches: null,
      selectedStoreId: null,
      location: null,
      radiusKm: DEFAULT_RADIUS_KM,
      supportCategory: null,
      activeTicketId: null,
      pendingAction: null,
    };
  }

  function get(userId) {
    if (!map.has(userId)) map.set(userId, blank());
    return map.get(userId);
  }

  return {
    get,
    set(userId, patch) {
      const cur = get(userId);
      Object.assign(cur, patch);
      return cur;
    },
    setState(userId, state, patch = {}) {
      const cur = get(userId);
      Object.assign(cur, patch, { state });
      return cur;
    },
    pushState(userId, state, patch = {}) {
      const cur = get(userId);
      cur.stack = [...(cur.stack || []), cur.state].slice(-12);
      Object.assign(cur, patch, { state });
      return cur;
    },
    popState(userId) {
      const cur = get(userId);
      const prev = (cur.stack || []).pop();
      cur.state = prev || STATES.MAIN_MENU;
      return cur;
    },
    resetToMain(userId) {
      const cur = get(userId);
      const keep = {
        lastSearch: cur.lastSearch,
        radiusKm: cur.radiusKm || DEFAULT_RADIUS_KM,
        location: cur.location,
        activeTicketId: cur.activeTicketId,
      };
      Object.assign(cur, blank(), keep);
      return cur;
    },
  };
}
