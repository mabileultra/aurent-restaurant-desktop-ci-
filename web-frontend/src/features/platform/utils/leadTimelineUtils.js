/**
 * leadTimelineUtils.js
 * Timeline event parsing, appending with length safety and legacy preservation,
 * author resolution from user session, and SLA urgency calculation.
 */

export const MAX_TIMELINE_LENGTH = 3800;

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

export function resolveCurrentAuthor(user) {
  if (!user) return 'Administrator';
  const nameParts = [user.firstName, user.lastName].filter(Boolean);
  if (nameParts.length > 0) return nameParts.join(' ').trim();
  if (user.username) return String(user.username).trim();
  return 'Administrator';
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
  const sourceLabel = formatLeadSource(lead?.source);
  const initial = lead?.createdAt
    ? [{
        id: 'initial',
        type: 'created',
        author: 'Sayt',
        text: `Ariza saytdan keldi · ${sourceLabel}`,
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
    at: lead?.createdAt || lead?.updatedAt || new Date().toISOString(),
  };
  return [legacyEvent, ...initial];
}

export function appendLeadTimelineEvent(currentNote, event, options = {}) {
  const { leadCreatedAt, maxLength = MAX_TIMELINE_LENGTH } = options;
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
        at: leadCreatedAt || new Date().toISOString(),
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
  const serialized = JSON.stringify(updated);

  if (serialized.length > maxLength) {
    throw new Error('Izohlar tarixi maksimal chegaradan (3800 belgi) oshib ketdi. Eski tarixni saqlash uchun yangi izohni qisqaroq yozing.');
  }

  return serialized;
}
