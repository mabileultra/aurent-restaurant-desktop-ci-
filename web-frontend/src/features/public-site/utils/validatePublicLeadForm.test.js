import { describe, expect, it } from 'vitest';
import { validatePublicLeadForm } from './validatePublicLeadForm';

describe('validatePublicLeadForm', () => {
  it('rejects single-char smoke junk', () => {
    expect(validatePublicLeadForm({ name: 'e', phone: 'e' }).ok).toBe(false);
  });

  it('accepts real contact', () => {
    const r = validatePublicLeadForm({ name: 'Ali', phone: '+998 90 123 45 67' });
    expect(r.ok).toBe(true);
    expect(r.phone).toContain('998');
  });
});
