/**
 * @aurent/shared-api — HTTP cross-cutting helpers (idempotency today).
 * Vertical endpoint modules stay in each app.
 */
export {
  generateIdempotencyKey,
  IDEMPOTENCY_HEADER,
  isFinancialOrCriticalEndpoint,
} from './idempotencyKey.js';
