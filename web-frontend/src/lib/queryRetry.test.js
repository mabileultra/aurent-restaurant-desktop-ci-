import { describe, expect, it } from 'vitest';
import { shouldRetryQuery } from './queryRetry';

describe('shouldRetryQuery', () => {
  it('retries a network failure twice', () => {
    expect(shouldRetryQuery(0, new Error('Network Error'))).toBe(true);
    expect(shouldRetryQuery(1, new Error('Network Error'))).toBe(true);
    expect(shouldRetryQuery(2, new Error('Network Error'))).toBe(false);
  });

  it('does not retry auth and not-found', () => {
    expect(shouldRetryQuery(0, { response: { status: 401 } })).toBe(false);
    expect(shouldRetryQuery(0, { response: { status: 403 } })).toBe(false);
    expect(shouldRetryQuery(0, { response: { status: 404 } })).toBe(false);
  });

  it('retries gateway errors', () => {
    expect(shouldRetryQuery(0, { response: { status: 502 } })).toBe(true);
  });
});
