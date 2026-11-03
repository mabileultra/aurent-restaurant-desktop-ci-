import { describe, expect, it } from 'vitest';
import React, { useState } from 'react';
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

  it('invalidates key when payloadSignature changes during component lifecycle', () => {
    const keysCaptured = [];

    function TestComponent() {
      const [amount, setAmount] = useState(100_000);
      const hook = useActionIdempotencyKey(`IN:1:${amount}:razmen`);

      keysCaptured.push(hook.getKey());

      if (amount === 100_000) {
        setAmount(200_000);
      }

      return null;
    }

    renderToStaticMarkup(React.createElement(TestComponent));

    // Must have rendered with initial amount, then re-rendered with new amount
    expect(keysCaptured.length).toBeGreaterThanOrEqual(2);
    expect(keysCaptured[0]).toBeTruthy();
    expect(keysCaptured[1]).toBeTruthy();
    // Key must have changed because signature changed!
    expect(keysCaptured[0]).not.toBe(keysCaptured[1]);
  });
});
