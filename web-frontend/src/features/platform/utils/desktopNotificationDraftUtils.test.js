import { describe, expect, it, vi } from 'vitest';
import {
  DRAFT_STORAGE_KEY,
  restoreDraftFromStorage,
  serializeDraftToStorage,
} from './desktopNotificationDraftUtils';

describe('desktopNotificationDraftUtils', () => {
  describe('restoreDraftFromStorage', () => {
    it('returns false for null, undefined or empty string', () => {
      expect(restoreDraftFromStorage(null, {})).toBe(false);
      expect(restoreDraftFromStorage('', {})).toBe(false);
      expect(restoreDraftFromStorage(undefined, {})).toBe(false);
    });

    it('returns false and does not throw for invalid JSON', () => {
      expect(restoreDraftFromStorage('{invalidJson', {})).toBe(false);
    });

    it('restores all targeting, scheduling, and message fields into setters', () => {
      const setters = {
        setTitle: vi.fn(),
        setBody: vi.fn(),
        setKind: vi.fn(),
        setDuration: vi.fn(),
        setCustomHours: vi.fn(),
        setTargetScope: vi.fn(),
        setTargetType: vi.fn(),
        setSelectedCompanyIds: vi.fn(),
        setSelectedStoreIds: vi.fn(),
        setSelectedCompanies: vi.fn(),
        setSelectedStores: vi.fn(),
        setScheduleType: vi.fn(),
        setScheduleDate: vi.fn(),
        setScheduleTime: vi.fn(),
      };

      const savedData = {
        title: 'Yangilanish',
        body: 'Yangi versiya chiqdi',
        kind: 'UPDATE',
        duration: 'custom',
        customHours: '48',
        targetScope: 'SELECT',
        targetType: 'STORES',
        selectedCompanyIds: [],
        selectedStoreIds: [1, 2],
        selectedCompanies: [],
        selectedStores: [{ id: 1, name: 'Filial 1' }],
        scheduleType: 'SCHEDULED',
        scheduleDate: '2026-11-02',
        scheduleTime: '10:00',
      };

      const result = restoreDraftFromStorage(JSON.stringify(savedData), setters);

      expect(result).toBe(true);
      expect(setters.setTitle).toHaveBeenCalledWith('Yangilanish');
      expect(setters.setBody).toHaveBeenCalledWith('Yangi versiya chiqdi');
      expect(setters.setKind).toHaveBeenCalledWith('UPDATE');
      expect(setters.setDuration).toHaveBeenCalledWith('custom');
      expect(setters.setCustomHours).toHaveBeenCalledWith('48');
      expect(setters.setTargetScope).toHaveBeenCalledWith('SELECT');
      expect(setters.setTargetType).toHaveBeenCalledWith('STORES');
      expect(setters.setSelectedStoreIds).toHaveBeenCalledWith([1, 2]);
      expect(setters.setSelectedStores).toHaveBeenCalledWith([{ id: 1, name: 'Filial 1' }]);
      expect(setters.setScheduleType).toHaveBeenCalledWith('SCHEDULED');
      expect(setters.setScheduleDate).toHaveBeenCalledWith('2026-11-02');
      expect(setters.setScheduleTime).toHaveBeenCalledWith('10:00');
    });
  });

  describe('serializeDraftToStorage', () => {
    it('returns null if form is completely empty', () => {
      const emptyState = {
        title: '',
        body: '',
        targetScope: 'ALL',
        scheduleType: 'NOW',
        selectedCompanyIds: [],
        selectedStoreIds: [],
      };
      expect(serializeDraftToStorage(emptyState)).toBeNull();
    });

    it('serializes state to JSON string when there is content', () => {
      const state = {
        title: 'Sarlavha',
        body: 'Matn',
        kind: 'ALERT',
        duration: '3d',
        customHours: '72',
        targetScope: 'SELECT',
        targetType: 'COMPANIES',
        selectedCompanyIds: [10],
        selectedStoreIds: [],
        selectedCompanies: [{ id: 10, name: 'A' }],
        selectedStores: [],
        scheduleType: 'NOW',
        scheduleDate: '',
        scheduleTime: '09:00',
      };

      const serialized = serializeDraftToStorage(state);
      expect(typeof serialized).toBe('string');
      const parsed = JSON.parse(serialized);
      expect(parsed.title).toBe('Sarlavha');
      expect(parsed.targetScope).toBe('SELECT');
      expect(parsed.selectedCompanyIds).toEqual([10]);
    });
  });
});
