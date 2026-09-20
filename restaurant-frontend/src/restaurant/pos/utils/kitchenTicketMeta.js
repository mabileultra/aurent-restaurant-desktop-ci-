import { formatDigitalTimer } from '../utils/formatElapsed';

const OVERDUE_SEC = {
  NEW: 5 * 60,
  ACCEPTED: 15 * 60,
  PREPARING: 20 * 60,
  READY: 10 * 60,
};

const TARGET_SEC = {
  NEW: 5 * 60,
  ACCEPTED: 12 * 60,
  PREPARING: 18 * 60,
  READY: 8 * 60,
};

export function ticketAgeSec(sentAt, now = Date.now()) {
  if (!sentAt) return 0;
  const started = new Date(sentAt).getTime();
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Math.floor((now - started) / 1000));
}

export function isTicketOverdue(ticket, now = Date.now()) {
  const limit = OVERDUE_SEC[ticket.status] ?? 15 * 60;
  return ticketAgeSec(ticket.sentAt, now) > limit;
}

export function ticketProgress(ticket, now = Date.now()) {
  const target = TARGET_SEC[ticket.status] ?? 15 * 60;
  const age = ticketAgeSec(ticket.sentAt, now);
  return Math.min(95, Math.round((age / target) * 100));
}

export function ticketTimerLabel(ticket, now = Date.now()) {
  const age = ticketAgeSec(ticket.sentAt, now);
  const limit = OVERDUE_SEC[ticket.status] ?? 15 * 60;
  if (age > limit) {
    const over = age - limit;
    const mm = String(Math.floor(over / 60)).padStart(2, '0');
    const ss = String(over % 60).padStart(2, '0');
    return `+${mm}:${ss}`;
  }
  return formatDigitalTimer(ticket.sentAt, now) || '00:00';
}

export function channelLabel(channel, t) {
  if (channel === 'TAKEAWAY') return t('rst.pos.takeaway');
  if (channel === 'DELIVERY') return t('rst.pos.delivery');
  return t('rst.kitchen.zoneHall');
}
