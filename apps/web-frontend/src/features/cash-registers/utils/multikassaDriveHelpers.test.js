import { describe, expect, it } from 'vitest';
import {
  collectDriveArrays,
  normalizeDrivesList,
  pickDriveTerminal,
} from './multikassaDriveHelpers';

describe('multikassaDriveHelpers', () => {
  it('collects nested drive arrays safely', () => {
    expect(collectDriveArrays(null)).toEqual([]);
    expect(collectDriveArrays([1, 2])).toEqual([[1, 2]]);
    expect(collectDriveArrays({ data: { drives: ['d1', 'd2'] } })).toEqual([['d1', 'd2']]);
  });

  it('picks drive terminal properly', () => {
    expect(pickDriveTerminal({ terminalID: 'T123' })).toBe('T123');
    expect(pickDriveTerminal({ module_gnk_id: 'M999' })).toBe('M999');
    expect(pickDriveTerminal({})).toBe('');
  });

  it('normalizes drives list from raw object', () => {
    const raw = {
      data: {
        drives: [
          { factoryId: 'F1', terminalId: 'T1', name: 'Drive 1' },
          { id: 'F2', name: 'Drive 2' },
        ],
      },
    };
    const list = normalizeDrivesList(raw);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe('F1');
    expect(list[0].terminalId).toBe('T1');
  });
});
