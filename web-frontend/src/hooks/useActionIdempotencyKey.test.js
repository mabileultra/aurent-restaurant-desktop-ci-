import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useActionIdempotencyKey } from './useActionIdempotencyKey';
import { IDEMPOTENCY_HEADER } from '../utils/idempotencyKey';

describe('useActionIdempotencyKey', () => {
  it('returns stable key across multiple calls and resets cleanly', () => {
    let captured = null;
    function TestComponent() {
      captured = useActionIdempotencyKey();
      return React.createElement('div', null, 'test');
    }

    renderToStaticMarkup(React.createElement(TestComponent));
    expect(captured).not.toBeNull();

    const key1 = captured.getKey();
    const key2 = captured.getKey();
    const headers = captured.getHeaders();

    expect(key1).toBeTruthy();
    expect(key1).toBe(key2);
    expect(headers[IDEMPOTENCY_HEADER]).toBe(key1);

    captured.resetKey();
    const key3 = captured.getKey();
    expect(key3).toBeTruthy();
    expect(key3).not.toBe(key1);
  });
});
