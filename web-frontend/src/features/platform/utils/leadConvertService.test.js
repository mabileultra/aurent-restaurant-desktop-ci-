import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertLeadToCompanyTransaction } from './leadConvertService';
import { platformLeadsApi } from '../../../api/platform/leads.api';

vi.mock('../../../api/platform/leads.api', () => ({
  platformLeadsApi: { convert: vi.fn() },
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

  it('rejects leads whose note already has conversion record', async () => {
    const convertedLead = { id: 11, status: 'IN_PROGRESS', managerNote: '[{"text":"Kompaniyaga aylantirildi. ID: 5"}]' };
    await expect(
      convertLeadToCompanyTransaction({ lead: convertedLead, company: { name: 'Test' } })
    ).rejects.toThrow('allaqachon kompaniya yaratilgan');
  });

  it('calls backend convert and maps credentials', async () => {
    platformLeadsApi.convert.mockResolvedValueOnce({
      data: {
        companyId: 77,
        companyLoginCode: 'VALI01',
        storeId: 88,
        adminCreated: true,
        adminUsername: 'valistroy',
        adminPassword: 'CustomSecurePassword1!',
        leadStatus: 'DONE',
      },
    });

    const lead = { id: 1, status: 'NEW', name: 'Vali', email: 'vali@stroy.uz' };
    const res = await convertLeadToCompanyTransaction({
      lead,
      company: {
        name: 'Vali Stroy',
        businessType: 'CONSTRUCTION',
        phone: '+998901234567',
        regionCode: 'UZ-TO',
        districtCode: 'UZ-TO-01',
      },
      branchName: "Bosh do'kon",
      adminUser: { login: 'valistroy', name: 'Vali', email: 'vali@stroy.uz', password: 'CustomSecurePassword1!' },
    });

    expect(res.companyId).toBe(77);
    expect(res.storeId).toBe(88);
    expect(res.adminCreated).toBe(true);
    expect(res.credentials).toEqual({
      username: 'valistroy',
      password: 'CustomSecurePassword1!',
      companyLoginCode: 'VALI01',
      role: 'ADMIN',
    });
    expect(platformLeadsApi.convert).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        companyName: 'Vali Stroy',
        createAdmin: true,
        markDone: true,
        adminLogin: 'valistroy',
      })
    );
  });
});
