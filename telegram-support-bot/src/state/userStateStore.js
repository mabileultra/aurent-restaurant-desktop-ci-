export const STATES = {
  MAIN: 'MAIN',
  SEARCH_WAIT_QUERY: 'SEARCH_WAIT_QUERY',
  NEARBY_WAIT_LOCATION: 'NEARBY_WAIT_LOCATION',
  SUPPORT_CATEGORY: 'SUPPORT_CATEGORY',
  SUPPORT_MESSAGE: 'SUPPORT_MESSAGE',
  SUPPORT_ACTIVE: 'SUPPORT_ACTIVE',
};

export const MENU = {
  FIND: '🔍 Найти лекарство',
  NEARBY: '📍 Аптеки рядом',
  FAVORITES: '⭐ Избранное',
  HISTORY: '🕘 История поиска',
  SUPPORT: '🆘 Поддержка',
  ABOUT: 'ℹ️ О сервисе',
  HOME: '🏠 Главное меню',
  SCAN: '📷 Сканировать штрихкод',
  LAST_QUERIES: '🕘 Последние запросы',
  SEND_LOCATION: '📍 Отправить моё местоположение',
};

/**
 * In-memory session state per Telegram user.
 */
export function createUserStateStore() {
  /** @type {Map<number, object>} */
  const map = new Map();

  function get(userId) {
    if (!map.has(userId)) {
      map.set(userId, {
        state: STATES.MAIN,
        supportCategory: null,
        activeTicketId: null,
        lastSearch: null,
        lastProductId: null,
      });
    }
    return map.get(userId);
  }

  return {
    get,
    setState(userId, state, patch = {}) {
      const current = get(userId);
      Object.assign(current, patch, { state });
      return current;
    },
    resetToMain(userId) {
      const current = get(userId);
      current.state = STATES.MAIN;
      current.supportCategory = null;
      // keep activeTicketId so user can still check status from support menu
      current.lastSearch = current.lastSearch || null;
      return current;
    },
  };
}
