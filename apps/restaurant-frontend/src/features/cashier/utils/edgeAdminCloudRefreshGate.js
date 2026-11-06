/**
 * When restaurant-desktop admin login should call cloud bootstrap.
 * Offline + local hall ready → skip cloud (PIN/roster stay local).
 * Empty local hall → need cloud once (or show needs-online error).
 */
export function shouldRefreshEdgeFromCloud({
  needsBootstrap,
  liveSession,
  offline,
} = {}) {
  if (offline) return Boolean(needsBootstrap);
  return Boolean(needsBootstrap) || !liveSession;
}

/** Fail hard only when local edge has nothing to work with. */
export function shouldFailAdminBootstrapHard({ needsBootstrap } = {}) {
  return Boolean(needsBootstrap);
}
