import { describe, expect, it } from 'vitest';
import {
  generateIdempotencyKey,
  IDEMPOTENCY_HEADER,
  isFinancialOrCriticalEndpoint,
} from './idempotencyKey';

describe('idempotencyKey utility', () => {
  it('generates a valid UUID string', () => {
    const key1 = generateIdempotencyKey();
    const key2 = generateIdempotencyKey();

    expect(typeof key1).toBe('string');
    expect(key1.length).toBeGreaterThanOrEqual(32);
    expect(key1).not.toBe(key2);
  });

  it('has expected header name', () => {
    expect(IDEMPOTENCY_HEADER).toBe('X-Idempotency-Key');
  });

  it('identifies critical financial endpoints correctly', () => {
    expect(isFinancialOrCriticalEndpoint('/pos/sales', 'POST')).toBe(true);
    expect(isFinancialOrCriticalEndpoint('/shifts/close', 'POST')).toBe(true);
    expect(isFinancialOrCriticalEndpoint('/billing/pay', 'POST')).toBe(true);
    expect(isFinancialOrCriticalEndpoint('/pos/returns', 'PUT')).toBe(true);

    expect(isFinancialOrCriticalEndpoint('/pos/sales', 'GET')).toBe(false);
    expect(isFinancialOrCriticalEndpoint('/products', 'GET')).toBe(false);
  });
});
