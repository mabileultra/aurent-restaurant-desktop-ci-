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

    it('restores message fields and forces safe ALL and NOW defaults for Tez kunda features', () => {
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
        selectedCompanyIds: [999999],
        selectedStoreIds: [1, 2],
        selectedCompanies: [{ id: 999999, name: 'Ghost' }],
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
      // Must force ALL and NOW and reset phantom entities
      expect(setters.setTargetScope).toHaveBeenCalledWith('ALL');
      expect(setters.setSelectedCompanyIds).toHaveBeenCalledWith([]);
      expect(setters.setSelectedStoreIds).toHaveBeenCalledWith([]);
      expect(setters.setSelectedCompanies).toHaveBeenCalledWith([]);
      expect(setters.setSelectedStores).toHaveBeenCalledWith([]);
      expect(setters.setScheduleType).toHaveBeenCalledWith('NOW');
      expect(setters.setScheduleDate).toHaveBeenCalledWith('');
      expect(setters.setScheduleTime).toHaveBeenCalledWith('09:00');
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

    it('serializes state to JSON string with safe defaults for Tez kunda fields', () => {
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
      expect(parsed.targetScope).toBe('ALL');
      expect(parsed.scheduleType).toBe('NOW');
      expect(parsed.selectedCompanyIds).toEqual([]);
    });
  });
});
