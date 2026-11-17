import { ROLE_OPTIONS } from './emailConstants';

export function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`.slice(0, 32);
}

export function computeRoleCounts(activeUsers) {
  const counts = { ADMIN: 0, CASHIER: 0, WAITER: 0, MANAGER: 0, COOK: 0 };
  activeUsers.forEach((u) => {
    const r = u.role?.toUpperCase();
    if (counts[r] !== undefined) counts[r] += 1;
  });
  return counts;
}

export function buildRoleOptionsWithCounts(roleCounts) {
  return ROLE_OPTIONS.map((opt) => ({
    ...opt,
    count: roleCounts[opt.id] ?? 0,
  }));
}

export function computeRecipientCount(mode, roles, activeUsers, totalElements) {
  if (mode === 'all') return totalElements ?? activeUsers.length;
  return activeUsers.filter((u) => Boolean(roles[u.role?.toUpperCase()])).length;
}

export function resolveEmailSampleUser(activeUsers, currentUser) {
  if (activeUsers.length > 0) {
    const u = activeUsers[0];
    return {
      name: u.fullName || u.username,
      email: u.email || 'user@aurent.uz',
      role: u.role,
      company: u.companyName || 'Aurent POS',
    };
  }
  if (currentUser) {
    return {
      name: currentUser.fullName || currentUser.username,
      email: currentUser.email || 'admin@aurent.uz',
      role: currentUser.role,
      company: 'Aurent POS',
    };
  }
  return {
    name: 'Xodim',
    email: 'user@aurent.uz',
    role: 'Foydalanuvchi',
    company: 'Aurent POS',
  };
}

export function validateEmailSendPayload({ subject, message, recipientCount }) {
  const errors = {};
  if (!subject.trim()) errors.subject = 'Mavzuni kiriting';
  if (!message.trim()) errors.message = 'Xabar matnini kiriting';

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors, toastMessage: 'Iltimos, maydonlarni to‘ldiring' };
  }
  if (recipientCount === 0) {
    return { valid: false, errors, toastMessage: 'Kamida bitta qabul qiluvchi tanlang' };
  }

  return { valid: true, errors: {} };
}
