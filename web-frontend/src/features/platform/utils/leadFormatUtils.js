/**
 * leadFormatUtils.js
 * Formatting utilities for phone, dates, preferred time, source/type/status labels,
 * and business type keyword guessing for Platform Leads.
 */

export {
  resolveCurrentAuthor,
  getLeadWaitUrgency,
  parseLeadTimeline,
  appendLeadTimelineEvent,
  MAX_TIMELINE_LENGTH,
} from './leadTimelineUtils';

const UZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];

export function cleanPhone(phone) {
  if (!phone) return '';
  const str = String(phone).trim();
  const digits = str.replace(/\D/g, '');
  return str.startsWith('+') ? `+${digits}` : `+${digits}`;
}

export function buildTelLink(phone) {
  const cleaned = cleanPhone(phone);
  return cleaned ? `tel:${cleaned}` : '#';
}

export function buildTelegramLink(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits ? `https://t.me/+${digits}` : '#';
}

export function buildMailtoLink(email) {
  return email ? `mailto:${String(email).trim()}` : '#';
}

export function formatLeadDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return String(dateString);
    const day = d.getDate();
    const month = UZ_MONTHS[d.getMonth()] || '';
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}, ${hours}:${mins}`;
  } catch {
    return String(dateString);
  }
}

export function formatLeadRelativeTime(dateString, now = new Date()) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'hozir';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${Math.max(1, mins)} daqiqa`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} soat`;
    const days = Math.floor(hours / 24);
    return `${days} kun`;
  } catch {
    return '';
  }
}

export function formatPreferredTime(time) {
  if (!time) return '—';
  const str = String(time).trim();
  if (!str) return '—';
  if (str.includes(':')) {
    return str.replace(/\s*-\s*/, ' – ');
  }
  const digits = str.replace(/\D/g, '');
  if (digits.length === 4) {
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  }
  if (digits.length === 3) {
    return `0${digits.slice(0, 1)}:${digits.slice(1, 3)}`;
  }
  return str;
}

const SOURCE_LABELS = {
  contacts: 'Bog\'lanish sahifasi',
  footer: 'Pastki qism (footer)',
  hero: 'Asosiy sahifa (hero)',
  pricing: 'Tariflar sahifasi',
  demo: 'Demo so\'rovi',
};

export function formatLeadSource(source) {
  if (!source) return 'Sayt';
  const key = String(source).trim().toLowerCase();
  return SOURCE_LABELS[key] || source;
}

const TYPE_LABELS = {
  CONNECT: 'Ulanish',
  DEMO: 'Demo',
  QUESTION: 'Savol',
  EQUIPMENT: 'Uskunalar',
};

export function formatLeadType(type) {
  if (!type) return '—';
  return TYPE_LABELS[type] || type;
}

const STATUS_LABELS = {
  NEW: 'Yangi',
  IN_PROGRESS: 'Jarayonda',
  DONE: 'Yakunlangan',
  REJECTED: 'Rad etilgan',
};

export function formatLeadStatus(status) {
  if (!status) return '—';
  return STATUS_LABELS[status] || status;
}

export function guessBusinessTypeFromMessage(message) {
  if (!message) return 'UNIVERSAL';
  const text = String(message).toLowerCase();
  if (text.includes('kiyim') || text.includes('libos') || text.includes('butik') || text.includes('moda') || text.includes('poyabzal')) {
    return 'CLOTHING';
  }
  if (text.includes('dorixona') || text.includes('dori') || text.includes('apteka') || text.includes('farm')) {
    return 'PHARMACY';
  }
  if (text.includes('restoran') || text.includes('stol') || text.includes('kafe') || text.includes('choyxona')) {
    return 'RESTAURANT';
  }
  if (text.includes('oshxona') || text.includes('bufet') || text.includes('canteen')) {
    return 'CANTEEN';
  }
  if (text.includes('qurilish') || text.includes('sement') || text.includes('stroy')) {
    return 'CONSTRUCTION';
  }
  if (text.includes('avto') || text.includes('zapchast') || text.includes('ehtiyot')) {
    return 'AUTO_PARTS';
  }
  if (text.includes('oziq-ovqat') || text.includes('do\'kon') || text.includes('dokon') || text.includes('minimarket') || text.includes('supermarket')) {
    return 'GROCERY';
  }
  return 'UNIVERSAL';
}
