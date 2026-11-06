/**
 * @aurent/shared-api — HTTP cross-cutting helpers.
 * Vertical endpoint modules stay in each app.
 */
export {
  generateIdempotencyKey,
  IDEMPOTENCY_HEADER,
  isFinancialOrCriticalEndpoint,
} from './idempotencyKey.js';
export {
  isApiNetworkError,
  notifyNetworkOffline,
  notifyNetworkOnline,
  AURENT_NETWORK_OFFLINE_EVENT,
  AURENT_NETWORK_ONLINE_EVENT,
} from './apiNetworkError.js';
