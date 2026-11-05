import { format } from 'date-fns';

export function displayCashierName(user) {
  if (!user) return '';
  const parts = [user.lastName, user.firstName, user.patronymic].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return user.username ?? '';
}

export function formatShiftOpenedAt(openedAt) {
  if (openedAt == null) return null;
  try {
    return format(new Date(openedAt), 'dd.MM.yyyy HH:mm');
  } catch {
    return null;
  }
}
