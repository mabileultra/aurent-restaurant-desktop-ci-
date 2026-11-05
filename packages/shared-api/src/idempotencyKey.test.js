import { describe, expect, it } from 'vitest';
import {
  generateIdempotencyKey,
  IDEMPOTENCY_HEADER,
  isFinancialOrCriticalEndpoint,
} from './idempotencyKey.js';

describe('@aurent/shared-api idempotencyKey', () => {
  it('generates unique keys', () => {
    const a = generateIdempotencyKey();
    const b = generateIdempotencyKey();
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });

  it('exports header name', () => {
    expect(IDEMPOTENCY_HEADER).toBe('X-Idempotency-Key');
  });

  it('flags financial endpoints', () => {
    expect(isFinancialOrCriticalEndpoint('/api/v1/sales', 'POST')).toBe(true);
    expect(isFinancialOrCriticalEndpoint('/api/v1/products', 'GET')).toBe(false);
  });
});
