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
  formatLeadSource,
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

export function getConvertedCompanyId(lead) {
  if (!lead?.managerNote) return null;
  const match = String(lead.managerNote).match(/ID:\s*(\d+)/i);
  return match ? match[1] : null;
}

export function normalizePhoneForSearch(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
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
  // Faqat va faqat to'liq 4 xonali vaqt bo'lsa (masalan "1200" -> "12:00", "0930" -> "09:30")
  if (/^\d{4}$/.test(str)) {
    const hh = Number(str.slice(0, 2));
    const mm = Number(str.slice(2, 4));
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
      return `${str.slice(0, 2)}:${str.slice(2, 4)}`;
    }
  }
  // Boshqa barcha noaniq qiymatlar ("111", "900", "ertalab") taxmin qilinmasdan asl holda ko'rsatiladi
  return str;
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
  if (!message || !String(message).trim()) return null;
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
  return null;
}
