/**
 * leadFilterUtils.js
 * Pure functions for calculating filter tab counts and sorting leads by urgency & date.
 */

import { getLeadWaitUrgency } from './leadTimelineUtils';

export function calculateLeadCounts(rawRows = []) {
  const counts = { ALL: rawRows.length, NEW: 0, IN_PROGRESS: 0, DONE: 0, REJECTED: 0 };
  rawRows.forEach((r) => {
    if (r?.status && typeof counts[r.status] === 'number') {
      counts[r.status] += 1;
    }
  });
  return counts;
}

export function filterAndSortLeads(rawRows = [], { status, leadType, search } = {}) {
  let list = rawRows;
  if (status) {
    list = list.filter((r) => r.status === status);
  }
  if (leadType) {
    list = list.filter((r) => r.leadType === leadType);
  }
  if (search && String(search).trim()) {
    const q = String(search).trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    list = list.filter((r) => {
      const name = (r.name || '').toLowerCase();
      const email = (r.email || '').toLowerCase();
      const phone = (r.phone || '');
      const phoneDigits = phone.replace(/\D/g, '');

      if (name.includes(q) || email.includes(q) || phone.toLowerCase().includes(q)) {
        return true;
      }
      if (qDigits && qDigits.length >= 3 && phoneDigits.includes(qDigits)) {
        return true;
      }
      return false;
    });
  }
  return [...list].sort((a, b) => {
    const uA = getLeadWaitUrgency(a).isUrgent ? 1 : 0;
    const uB = getLeadWaitUrgency(b).isUrgent ? 1 : 0;
    if (uA !== uB) return uB - uA;
    // For urgent leads: longest waiting (oldest createdAt) at the top
    if (uA === 1) {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    // For non-urgent leads: newest at the top
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}
