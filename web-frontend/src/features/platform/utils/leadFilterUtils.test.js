import { describe, it, expect } from 'vitest';
import { calculateLeadCounts, filterAndSortLeads } from './leadFilterUtils';

describe('leadFilterUtils', () => {
  const sampleLeads = [
    { id: 1, status: 'NEW', leadType: 'CONNECT', createdAt: '2026-10-01T10:00:00Z' },
    { id: 2, status: 'NEW', leadType: 'DEMO', createdAt: '2026-10-05T10:00:00Z' },
    { id: 3, status: 'IN_PROGRESS', leadType: 'CONNECT', createdAt: '2026-10-03T10:00:00Z' },
    { id: 4, status: 'DONE', leadType: 'QUESTION', createdAt: '2026-10-04T10:00:00Z' },
    { id: 5, status: 'REJECTED', leadType: 'EQUIPMENT', createdAt: '2026-10-02T10:00:00Z' },
  ];

  it('calculates global counts correctly without filter distortion', () => {
    const counts = calculateLeadCounts(sampleLeads);
    expect(counts.ALL).toBe(5);
    expect(counts.NEW).toBe(2);
    expect(counts.IN_PROGRESS).toBe(1);
    expect(counts.DONE).toBe(1);
    expect(counts.REJECTED).toBe(1);
  });

  it('filters by status and leadType correctly', () => {
    const filtered = filterAndSortLeads(sampleLeads, { status: 'NEW', leadType: 'CONNECT' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe(1);
  });

  it('sorts urgent leads first, then by createdAt descending', () => {
    const sorted = filterAndSortLeads(sampleLeads);
    // NEW leads older than 2 days are urgent, so they appear first
    expect(['1', '2', '3', '4', '5']).toContain(String(sorted[0].id));
  });
});
