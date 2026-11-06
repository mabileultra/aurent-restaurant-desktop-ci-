import { describe, it, expect, vi } from 'vitest';
import { buildUserActions } from './userActionsHelper';

describe('buildUserActions', () => {
  const t = (key, opts) => opts?.defaultValue || key;

  it('builds action list with edit, toggle active, reset, copy id, and delete', () => {
    const user = { id: '123', username: 'kassir1', active: true, role: 'CASHIER' };
    const actions = buildUserActions({
      user,
      isSelf: false,
      actorRole: 'ADMIN',
      onEdit: vi.fn(),
      onToggleActive: vi.fn(),
      onDelete: vi.fn(),
      t,
    });

    expect(actions).toHaveLength(5);
    expect(actions[0].label).toBe('Tahrirlash');
    expect(actions[1].label).toBe('Faolsizlantirish');
    expect(actions[1].disabled).toBe(false);
    expect(actions[4].label).toBe('O‘chirish');
    expect(actions[4].disabled).toBe(false);
  });

  it('disables deactivation when user is current logged-in user and active', () => {
    const user = { id: 'admin1', username: 'admin', active: true, role: 'SUPER_ADMIN' };
    const actions = buildUserActions({
      user,
      isSelf: true,
      actorRole: 'SUPER_ADMIN',
      onEdit: vi.fn(),
      onToggleActive: vi.fn(),
      onDelete: vi.fn(),
      t,
    });

    const deactivateAction = actions.find((a) => a.label === 'Faolsizlantirish');
    expect(deactivateAction.disabled).toBe(true);
    expect(deactivateAction.disabledReason).toContain('faolsizlantira olmaysiz');
  });

  it('allows activation if self is currently inactive', () => {
    const user = { id: 'admin1', username: 'admin', active: false, role: 'SUPER_ADMIN' };
    const actions = buildUserActions({
      user,
      isSelf: true,
      actorRole: 'SUPER_ADMIN',
      onEdit: vi.fn(),
      onToggleActive: vi.fn(),
      onDelete: vi.fn(),
      t,
    });

    const activateAction = actions.find((a) => a.label === 'Faollashtirish');
    expect(activateAction.disabled).toBe(false);
  });
});
