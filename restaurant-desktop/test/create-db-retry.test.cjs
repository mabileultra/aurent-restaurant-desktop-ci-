const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

/** Same backoff used for ECONNRESET after Windows pg_ctl. */
function nextDelay(attempt) {
  return Math.min(2_500, 400 + attempt * 150);
}

describe('create DB retry backoff', () => {
  it('grows then caps', () => {
    assert.equal(nextDelay(1), 550);
    assert.equal(nextDelay(5), 1_150);
    assert.equal(nextDelay(20), 2_500);
  });

  it('covers ~20s of Windows accept lag across 20 attempts', () => {
    let total = 0;
    for (let i = 1; i <= 20; i += 1) total += nextDelay(i);
    assert.ok(total >= 15_000, `expected >=15s budget, got ${total}`);
  });
});
