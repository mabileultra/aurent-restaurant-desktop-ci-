/**
 * leadFormatUtils.js
 * Utilities for formatting, timeline handling, SLA urgency, and business type guessing for Platform Leads.
 */

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

export function getLeadWaitUrgency(lead, now = new Date()) {
  if (!lead || lead.status !== 'NEW') {
    return { isUrgent: false, waitText: null, level: null, days: 0, hours: 0 };
  }
  try {
    const d = new Date(lead.createdAt);
    const diffMs = now.getTime() - d.getTime();
    const hours = Math.max(0, Math.floor(diffMs / 3600000));
    const days = Math.floor(hours / 24);

    if (days >= 2) {
      return { isUrgent: true, waitText: `${days} kundan beri javobsiz`, level: 'danger', days, hours };
    }
    if (days >= 1) {
      return { isUrgent: true, waitText: '1 kundan beri javobsiz', level: 'warning', days, hours };
    }
    return {
      isUrgent: false,
      waitText: `${Math.max(1, hours)} soatdan beri javobsiz`,
      level: 'info',
      days,
      hours,
    };
  } catch {
    return { isUrgent: false, waitText: null, level: null, days: 0, hours: 0 };
  }
}

export function parseLeadTimeline(managerNote, lead) {
  const initial = lead?.createdAt
    ? [{
        id: 'initial',
        type: 'created',
        author: 'Sayt',
        text: `Ariza saytdan keldi · ${lead.source || 'sayt'}`,
        at: lead.createdAt,
      }]
    : [];

  if (!managerNote || !String(managerNote).trim()) {
    return initial;
  }

  const raw = String(managerNote).trim();
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const customEvents = parsed.filter((e) => e && e.type !== 'created');
      return [...customEvents, ...initial].sort((a, b) => new Date(b.at) - new Date(a.at));
    }
  } catch {
    // Legacy plain text note
  }

  const legacyEvent = {
    id: 'legacy-note',
    type: 'comment',
    author: 'Administrator',
    text: raw,
    at: lead?.updatedAt || lead?.createdAt || new Date().toISOString(),
  };
  return [legacyEvent, ...initial];
}

export function appendLeadTimelineEvent(currentNote, event) {
  let existing = [];
  if (currentNote && String(currentNote).trim()) {
    try {
      const parsed = JSON.parse(currentNote.trim());
      if (Array.isArray(parsed)) {
        existing = parsed.filter((e) => e && e.type !== 'created');
      }
    } catch {
      existing = [{
        id: 'legacy-note',
        type: 'comment',
        author: 'Administrator',
        text: currentNote.trim(),
        at: new Date().toISOString(),
      }];
    }
  }

  const newEntry = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: event.type || 'comment',
    author: event.author || 'Administrator',
    text: event.text || '',
    at: event.at || new Date().toISOString(),
  };

  const updated = [newEntry, ...existing];
  return JSON.stringify(updated);
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
    return 'BUILDING_MATERIALS';
  }
  if (text.includes('avto') || text.includes('zapchast') || text.includes('ehtiyot')) {
    return 'AUTO_PARTS';
  }
  if (text.includes('oziq-ovqat') || text.includes('do\'kon') || text.includes('dokon') || text.includes('minimarket') || text.includes('supermarket')) {
    return 'GROCERY';
  }
  return 'UNIVERSAL';
}
