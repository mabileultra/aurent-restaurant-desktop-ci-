import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertLeadToCompanyTransaction } from './leadConvertService';
import { companyApi } from '../../../api/company.api';
import { storeApi } from '../../../api/store.api';
import { userApi } from '../../../api/user.api';
import { companyBusinessTypeApi } from '../../../api/companyBusinessType.api';
import { platformBusinessTypeApi } from '../../../api/platform/businessType.api';
import { platformLeadsApi } from '../../../api/platform/leads.api';

vi.mock('../../../api/company.api', () => ({
  companyApi: { create: vi.fn() },
}));
vi.mock('../../../api/store.api', () => ({
  storeApi: { create: vi.fn() },
}));
vi.mock('../../../api/user.api', () => ({
  userApi: { create: vi.fn() },
}));
vi.mock('../../../api/companyBusinessType.api', () => ({
  companyBusinessTypeApi: { assign: vi.fn() },
}));
vi.mock('../../../api/platform/businessType.api', () => ({
  platformBusinessTypeApi: { list: vi.fn() },
}));
vi.mock('../../../api/platform/leads.api', () => ({
  platformLeadsApi: { update: vi.fn() },
}));

describe('leadConvertService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects already DONE leads to prevent duplicate conversion', async () => {
    const doneLead = { id: 10, status: 'DONE' };
    await expect(
      convertLeadToCompanyTransaction({ lead: doneLead, company: { name: 'Test' } })
    ).rejects.toThrow('allaqachon yakunlangan');
  });

  it('executes full company, store, user creation and updates lead', async () => {
    companyApi.create.mockResolvedValueOnce({ data: { id: 77 } });
    platformBusinessTypeApi.list.mockResolvedValueOnce({ data: [{ id: 5, code: 'CONSTRUCTION' }] });
    companyBusinessTypeApi.assign.mockResolvedValueOnce({ data: { ok: true } });
    storeApi.create.mockResolvedValueOnce({ data: { id: 88 } });
    userApi.create.mockResolvedValueOnce({ data: { id: 99 } });
    platformLeadsApi.update.mockResolvedValueOnce({ data: { ok: true } });

    const lead = { id: 1, status: 'NEW', name: 'Vali', createdAt: '2026-11-01T10:00:00Z' };
    const res = await convertLeadToCompanyTransaction({
      lead,
      company: { name: 'Vali Stroy', businessType: 'CONSTRUCTION', phone: '+998901234567' },
      branchName: 'Bosh do\'kon',
      adminUser: { login: 'valistroy', name: 'Vali' },
      markDone: true,
      author: 'SuperAdmin',
    });

    expect(res.companyId).toBe(77);
    expect(res.storeId).toBe(88);
    expect(res.adminCreated).toBe(true);

    expect(companyApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Vali Stroy', businessType: 'CONSTRUCTION' })
    );
    expect(companyBusinessTypeApi.assign).toHaveBeenCalledWith(77, { typeIds: [5], defaultTypeId: 5 });
    expect(storeApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 77, name: 'Bosh do\'kon' })
    );
    expect(userApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 77, username: 'valistroy', role: 'ADMIN' })
    );
    expect(platformLeadsApi.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: 'DONE' })
    );
  });
});
