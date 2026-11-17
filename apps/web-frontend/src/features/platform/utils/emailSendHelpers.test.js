import { describe, expect, it } from 'vitest';
import {
  createIdempotencyKey,
  computeRoleCounts,
  buildRoleOptionsWithCounts,
  computeRecipientCount,
  resolveEmailSampleUser,
  validateEmailSendPayload,
} from './emailSendHelpers';

describe('emailSendHelpers', () => {
  it('creates unique idempotency keys', () => {
    const key1 = createIdempotencyKey();
    const key2 = createIdempotencyKey();
    expect(key1).toBeTruthy();
    expect(key2).toBeTruthy();
    expect(key1).not.toBe(key2);
  });

  it('computes role counts correctly', () => {
    const users = [
      { role: 'admin' },
      { role: 'ADMIN' },
      { role: 'CASHIER' },
      { role: 'UNKNOWN' },
    ];
    const counts = computeRoleCounts(users);
    expect(counts.ADMIN).toBe(2);
    expect(counts.CASHIER).toBe(1);
    expect(counts.COOK).toBe(0);
  });

  it('builds role options with counts', () => {
    const counts = { ADMIN: 5 };
    const options = buildRoleOptionsWithCounts(counts);
    const adminOpt = options.find((o) => o.id === 'ADMIN');
    expect(adminOpt?.count).toBe(5);
  });

  it('computes recipient count for all and role modes', () => {
    const users = [
      { role: 'ADMIN' },
      { role: 'CASHIER' },
    ];
    const allCount = computeRecipientCount('all', {}, users, 10);
    expect(allCount).toBe(10);

    const roleCount = computeRecipientCount('role', { ADMIN: true, CASHIER: false }, users, 10);
    expect(roleCount).toBe(1);
  });

  it('validates email send payload', () => {
    const invalid = validateEmailSendPayload({ subject: '', message: '', recipientCount: 0 });
    expect(invalid.valid).toBe(false);

    const valid = validateEmailSendPayload({ subject: 'Subj', message: 'Body', recipientCount: 5 });
    expect(valid.valid).toBe(true);
  });
});
