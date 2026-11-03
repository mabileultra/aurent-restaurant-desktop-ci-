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
  companyBusinessTypeApi: { setForCompany: vi.fn() },
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

  it('rejects leads whose note already has conversion record', async () => {
    const convertedLead = { id: 11, status: 'IN_PROGRESS', managerNote: '[{"text":"Kompaniyaga aylantirildi. ID: 5"}]' };
    await expect(
      convertLeadToCompanyTransaction({ lead: convertedLead, company: { name: 'Test' } })
    ).rejects.toThrow('allaqachon kompaniya yaratilgan');
  });

  it('executes full company, store, user creation and updates lead with secure password', async () => {
    companyApi.create.mockResolvedValueOnce({ data: { id: 77, loginCode: 'VALI01' } });
    platformBusinessTypeApi.list.mockResolvedValueOnce({ data: [{ id: 5, code: 'CONSTRUCTION' }] });
    companyBusinessTypeApi.setForCompany.mockResolvedValueOnce({ data: { ok: true } });
    storeApi.create.mockResolvedValueOnce({ data: { id: 88 } });
    userApi.create.mockResolvedValueOnce({ data: { id: 99 } });
    platformLeadsApi.update.mockResolvedValue({ data: { ok: true } });

    const lead = { id: 1, status: 'NEW', name: 'Vali', email: 'vali@stroy.uz', createdAt: '2026-11-01T10:00:00Z' };
    const res = await convertLeadToCompanyTransaction({
      lead,
      company: { name: 'Vali Stroy', businessType: 'CONSTRUCTION', phone: '+998901234567' },
      branchName: 'Bosh do\'kon',
      adminUser: { login: 'valistroy', name: 'Vali', email: 'vali@stroy.uz', password: 'CustomSecurePassword1!' },
      author: 'SuperAdmin',
    });

    expect(res.companyId).toBe(77);
    expect(res.companyLoginCode).toBe('VALI01');
    expect(res.storeId).toBe(88);
    expect(res.adminCreated).toBe(true);
    expect(res.credentials).toEqual({
      username: 'valistroy',
      password: 'CustomSecurePassword1!',
      companyLoginCode: 'VALI01',
      role: 'ADMIN',
    });

    expect(companyApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Vali Stroy', businessType: 'CONSTRUCTION' })
    );
    expect(companyBusinessTypeApi.setForCompany).toHaveBeenCalledWith(77, { typeIds: [5], defaultTypeId: 5 });
    expect(storeApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 77, name: 'Bosh do\'kon' })
    );
    expect(userApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 77,
        username: 'valistroy',
        password: 'CustomSecurePassword1!',
        email: 'vali@stroy.uz',
        role: 'ADMIN',
      })
    );
    expect(platformLeadsApi.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: 'DONE' })
    );
  });

  it('records store and user errors gracefully without false success', async () => {
    companyApi.create.mockResolvedValueOnce({ data: { id: 77, loginCode: 'ERR01' } });
    storeApi.create.mockRejectedValueOnce(new Error('Store limit reached'));
    userApi.create.mockRejectedValueOnce(new Error('Username taken'));
    platformLeadsApi.update.mockResolvedValue({ data: { ok: true } });

    const lead = { id: 2, status: 'NEW', name: 'Ali', email: 'ali@market.uz', createdAt: '2026-11-01T10:00:00Z' };
    const res = await convertLeadToCompanyTransaction({
      lead,
      company: { name: 'Ali Market' },
      branchName: 'Filial 1',
      adminUser: { login: 'alimarket', email: 'ali@market.uz' },
    });

    expect(res.companyId).toBe(77);
    expect(res.storeId).toBeNull();
    expect(res.storeError).toBe('Store limit reached');
    expect(res.adminCreated).toBe(false);
    expect(res.userError).toBe('Username taken');
    expect(res.credentials).toBeNull();
    expect(platformLeadsApi.update).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ status: 'DONE' })
    );
  });

  it('reports missing real email error gracefully', async () => {
    companyApi.create.mockResolvedValueOnce({ data: { id: 78, loginCode: 'NOEMAIL' } });
    platformLeadsApi.update.mockResolvedValue({ data: { ok: true } });

    const lead = { id: 3, status: 'NEW', name: 'NoEmail' };
    const res = await convertLeadToCompanyTransaction({
      lead,
      company: { name: 'No Email Market' },
      adminUser: { login: 'noemail' },
    });

    expect(res.companyId).toBe(78);
    expect(res.adminCreated).toBe(false);
    expect(res.userError).toBe('Admin uchun haqiqiy email manzili kiritilmadi');
  });
});
