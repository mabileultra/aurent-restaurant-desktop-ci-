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

export function filterAndSortLeads(rawRows = [], { status, leadType } = {}) {
  let list = rawRows;
  if (status) {
    list = list.filter((r) => r.status === status);
  }
  if (leadType) {
    list = list.filter((r) => r.leadType === leadType);
  }
  return [...list].sort((a, b) => {
    const uA = getLeadWaitUrgency(a).isUrgent ? 1 : 0;
    const uB = getLeadWaitUrgency(b).isUrgent ? 1 : 0;
    if (uA !== uB) return uB - uA;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}
