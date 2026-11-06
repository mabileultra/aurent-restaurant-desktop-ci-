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

    it('restores message fields, preserves targetScope SELECT and selections, and resets past schedule', () => {
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
        setIsTargetingReset: vi.fn(),
      };

      const savedData = {
        title: 'Yangilanish',
        body: 'Yangi versiya chiqdi',
        kind: 'UPDATE',
        duration: 'custom',
        customHours: '48',
        targetScope: 'SELECT',
        targetType: 'STORES',
        selectedCompanyIds: [10],
        selectedStoreIds: [1, 2],
        selectedCompanies: [{ id: 10, name: 'Alpha' }],
        selectedStores: [{ id: 1, name: 'Filial 1' }],
        scheduleType: 'SCHEDULED',
        scheduleDate: '2020-01-01',
        scheduleTime: '10:00',
      };

      const result = restoreDraftFromStorage(JSON.stringify(savedData), setters);

      expect(result).toBe(true);
      expect(setters.setTitle).toHaveBeenCalledWith('Yangilanish');
      expect(setters.setBody).toHaveBeenCalledWith('Yangi versiya chiqdi');
      expect(setters.setKind).toHaveBeenCalledWith('UPDATE');
      expect(setters.setDuration).toHaveBeenCalledWith('custom');
      expect(setters.setCustomHours).toHaveBeenCalledWith('48');
      // Preserves SELECT and selections
      expect(setters.setTargetScope).toHaveBeenCalledWith('SELECT');
      expect(setters.setTargetType).toHaveBeenCalledWith('STORES');
      expect(setters.setSelectedCompanyIds).toHaveBeenCalledWith([10]);
      expect(setters.setSelectedStoreIds).toHaveBeenCalledWith([1, 2]);
      expect(setters.setSelectedCompanies).toHaveBeenCalledWith([{ id: 10, name: 'Alpha' }]);
      expect(setters.setSelectedStores).toHaveBeenCalledWith([{ id: 1, name: 'Filial 1' }]);
      // Past date (2020-01-01) safely resets to NOW
      expect(setters.setScheduleType).toHaveBeenCalledWith('NOW');
      expect(setters.setScheduleDate).toHaveBeenCalledWith('');
      expect(setters.setScheduleTime).toHaveBeenCalledWith('09:00');
    });

    it('restores future scheduled date and time', () => {
      const setters = {
        setTitle: vi.fn(),
        setBody: vi.fn(),
        setScheduleType: vi.fn(),
        setScheduleDate: vi.fn(),
        setScheduleTime: vi.fn(),
      };

      const futureDate = '2099-12-31';
      const savedData = {
        title: 'Kelajakdagi xabar',
        body: 'Test',
        scheduleType: 'SCHEDULED',
        scheduleDate: futureDate,
        scheduleTime: '15:30',
      };

      const result = restoreDraftFromStorage(JSON.stringify(savedData), setters);

      expect(result).toBe(true);
      expect(setters.setScheduleType).toHaveBeenCalledWith('SCHEDULED');
      expect(setters.setScheduleDate).toHaveBeenCalledWith(futureDate);
      expect(setters.setScheduleTime).toHaveBeenCalledWith('15:30');
    });

    it('returns false when draft only has phantom targetScope or schedule without title/body', () => {
      const setters = {
        setTargetScope: vi.fn(),
        setScheduleType: vi.fn(),
      };
      const ghostDraft = {
        title: '',
        body: '',
        targetScope: 'SELECT',
        selectedCompanyIds: [999999],
        scheduleType: 'SCHEDULED',
      };
      const result = restoreDraftFromStorage(JSON.stringify(ghostDraft), setters);
      expect(result).toBe(false);
    });
  });

  describe('serializeDraftToStorage', () => {
    it('returns null if form has no title or body', () => {
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

    it('serializes state to JSON string preserving targeting and scheduling fields', () => {
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
        scheduleType: 'SCHEDULED',
        scheduleDate: '2026-12-01',
        scheduleTime: '09:00',
      };

      const serialized = serializeDraftToStorage(state);
      expect(typeof serialized).toBe('string');
      const parsed = JSON.parse(serialized);
      expect(parsed.title).toBe('Sarlavha');
      expect(parsed.targetScope).toBe('SELECT');
      expect(parsed.targetType).toBe('COMPANIES');
      expect(parsed.selectedCompanyIds).toEqual([10]);
      expect(parsed.selectedCompanies).toEqual([{ id: 10, name: 'A' }]);
      expect(parsed.scheduleType).toBe('SCHEDULED');
      expect(parsed.scheduleDate).toBe('2026-12-01');
      expect(parsed.scheduleTime).toBe('09:00');
    });
  });
});
