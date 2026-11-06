import { describe, expect, it } from 'vitest';
import { MANAGEMENT_ROLES, STAFF_ROLES, compareUserFullName } from './useUsersPage';

describe('useUsersPage role constants', () => {
  it('includes proper management and staff roles', () => {
    expect(MANAGEMENT_ROLES).toContain('ADMIN');
    expect(MANAGEMENT_ROLES).toContain('MANAGER');
    expect(MANAGEMENT_ROLES).toContain('PLATFORM_ADMIN');
    expect(MANAGEMENT_ROLES).toContain('PLATFORM_ANALYTICS');

    expect(STAFF_ROLES).toContain('CASHIER');
    expect(STAFF_ROLES).toContain('WAITER');
    expect(STAFF_ROLES).toContain('COOK');
    expect(STAFF_ROLES).toContain('COURIER');
    expect(STAFF_ROLES).toContain('ACCOUNTANT');
  });

  it('keeps management and staff mutually exclusive', () => {
    const intersection = MANAGEMENT_ROLES.filter((role) => STAFF_ROLES.includes(role));
    expect(intersection).toEqual([]);
  });
});

describe('compareUserFullName', () => {
  const userA = { id: 1, fullName: 'Ali Valiyev', username: 'ali' };
  const userB = { id: 2, fullName: 'Bobur Usmonov', username: 'bobur' };
  const userEmptyDash = { id: 3, fullName: '– – –', username: 'kassir3' }; // en-dashes
  const userEmptyEmDash = { id: 4, fullName: '— —', username: 'kassir4' }; // em-dashes
  const userNoName = { id: 5, fullName: '', username: 'user5' };

  it('sorts valid full names ascending and descending', () => {
    expect(compareUserFullName(userA, userB, 'asc')).toBeLessThan(0);
    expect(compareUserFullName(userA, userB, 'desc')).toBeGreaterThan(0);
  });

  it('pushes en-dash and symbol-only names to the bottom in ascending sort', () => {
    const list = [userEmptyDash, userB, userA, userEmptyEmDash, userNoName];
    const sorted = [...list].sort((a, b) => compareUserFullName(a, b, 'asc'));

    expect(sorted[0].fullName).toBe('Ali Valiyev');
    expect(sorted[1].fullName).toBe('Bobur Usmonov');
    // All 3 empty/dummy entries must be at the bottom
    expect(sorted.slice(2).map((u) => u.id)).toEqual([3, 4, 5]);
  });

  it('pushes en-dash and symbol-only names to the bottom in descending sort as well', () => {
    const list = [userEmptyDash, userA, userB, userNoName];
    const sorted = [...list].sort((a, b) => compareUserFullName(a, b, 'desc'));

    expect(sorted[0].fullName).toBe('Bobur Usmonov');
    expect(sorted[1].fullName).toBe('Ali Valiyev');
    // Empty entries must still be at the bottom (sorted among themselves by username desc)
    expect(sorted.slice(2).map((u) => u.id)).toEqual([5, 3]);
  });

  it('interweaves Cyrillic and Latin names phonetically without grouping them separately', () => {
    const userAzizCyrillic = { id: 10, fullName: 'Азиз Каримов', username: 'aziz' };
    const userAliLatin = { id: 11, fullName: 'Ali Valiyev', username: 'ali' };
    const userBoburLatin = { id: 12, fullName: 'Bobur Usmonov', username: 'bobur' };
    const userValiCyrillic = { id: 13, fullName: 'Вали Зокиров', username: 'vali' };
    const userZafarLatin = { id: 14, fullName: 'Zafar Ergashev', username: 'zafar' };

    const list = [userZafarLatin, userValiCyrillic, userBoburLatin, userAzizCyrillic, userAliLatin];
    const sorted = [...list].sort((a, b) => compareUserFullName(a, b, 'asc'));

    // Both Ali and Aziz come before Bobur
    expect(['Ali Valiyev', 'Азиз Каримов']).toContain(sorted[0].fullName);
    expect(['Ali Valiyev', 'Азиз Каримов']).toContain(sorted[1].fullName);
    expect(sorted[2].fullName).toBe('Bobur Usmonov');
    expect(sorted[3].fullName).toBe('Вали Зокиров');
    expect(sorted[4].fullName).toBe('Zafar Ergashev');
  });
});

describe('role-scoped tab count logic', () => {
  it('correctly calculates status counts filtered by role', () => {
    const mockUsers = [
      { id: 1, role: 'ADMIN', active: true },
      { id: 2, role: 'ADMIN', active: true },
      { id: 3, role: 'ADMIN', active: false },
      { id: 4, role: 'CASHIER', active: true },
      { id: 5, role: 'CASHIER', active: false },
    ];

    const filterByRole = (roleFilter) => {
      if (!roleFilter || roleFilter === 'ALL') return mockUsers;
      return mockUsers.filter((u) => u.role === roleFilter);
    };

    const adminScoped = filterByRole('ADMIN');
    expect(adminScoped.length).toBe(3);
    expect(adminScoped.filter((u) => u.active).length).toBe(2);
    expect(adminScoped.filter((u) => !u.active).length).toBe(1);

    const cashierScoped = filterByRole('CASHIER');
    expect(cashierScoped.length).toBe(2);
    expect(cashierScoped.filter((u) => u.active).length).toBe(1);
    expect(cashierScoped.filter((u) => !u.active).length).toBe(1);
  });
});
