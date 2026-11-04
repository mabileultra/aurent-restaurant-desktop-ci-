const STATES = {
  MAIN: 'main',
  WAIT_CATEGORY: 'wait_category',
  WAIT_MESSAGE: 'wait_message',
  ACTIVE: 'active',
};

export function createUserStateStore() {
  const map = new Map();

  return {
    get(userId) {
      return map.get(userId) || { state: STATES.MAIN, category: null, activeTicketId: null };
    },
    set(userId, patch) {
      const prev = this.get(userId);
      map.set(userId, { ...prev, ...patch });
    },
    reset(userId) {
      map.set(userId, { state: STATES.MAIN, category: null, activeTicketId: null });
    },
  };
}

export { STATES };
