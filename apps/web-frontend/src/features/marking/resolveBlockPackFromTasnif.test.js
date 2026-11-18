import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tasnifApi } from '../../api/tasnif.api';
import { resolveBlockPackFromTasnif } from './resolveBlockPackFromTasnif';

vi.mock('../../api/tasnif.api', () => ({
  tasnifApi: { detail: vi.fn() },
}));

const BLOCK_KM = '0114780131183003217Mj=?rFdu+Eg+\u2194931vcj';
const PIECE_KM = '0104780131183003217Mj=?rFdu+Eg+\u2194931vcj';

describe('resolveBlockPackFromTasnif', () => {
  beforeEach(() => {
    tasnifApi.detail.mockReset();
  });

  it('resolves block size from Tasnif for pack-level GTIN', async () => {
    tasnifApi.detail.mockResolvedValue({
      data: {
        packages: [
          { code: '1', nameRu: 'шт' },
          { code: '15001', nameRu: 'блок = 15 шт' },
          { code: '15002', nameRu: 'коробка = 240 шт' },
        ],
      },
    });
    const pack = await resolveBlockPackFromTasnif({
      ikpu: '03214001014000010',
      mark: BLOCK_KM,
    });
    expect(pack).toMatchObject({
      sellAsBlock: true,
      unitsInPack: 15,
      packageCode: '15001',
    });
  });

  it('ignores piece-level GTIN (indicator 0)', async () => {
    const pack = await resolveBlockPackFromTasnif({
      ikpu: '03214001014000010',
      mark: PIECE_KM,
    });
    expect(pack).toBeNull();
    expect(tasnifApi.detail).not.toHaveBeenCalled();
  });
});
