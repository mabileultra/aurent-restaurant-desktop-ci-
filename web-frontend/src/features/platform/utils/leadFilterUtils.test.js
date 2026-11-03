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

  it('sorts urgent leads with oldest/longest waiting at the top', () => {
    const urgentLeads = [
      { id: 14, status: 'NEW', createdAt: '2026-10-20T10:00:00Z' }, // 14 days ago
      { id: 62, status: 'NEW', createdAt: '2026-09-02T10:00:00Z' }, // 62 days ago
      { id: 19, status: 'NEW', createdAt: '2026-10-15T10:00:00Z' }, // 19 days ago
    ];
    const sorted = filterAndSortLeads(urgentLeads);
    expect(sorted.map((l) => l.id)).toEqual([62, 19, 14]);
  });

  it('filters by phone number with spaces correctly', () => {
    const leads = [
      { id: 1, name: 'Ali', phone: '+998900000101', status: 'NEW' },
      { id: 2, name: 'Vali', phone: '+998911112233', status: 'NEW' },
    ];
    const result = filterAndSortLeads(leads, { search: '90 000 01 01' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});
