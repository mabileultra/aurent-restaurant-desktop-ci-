/**
 * Converts a landing lead via the transactional backend endpoint.
 */

import { platformLeadsApi } from '../../../api/platform/leads.api';

export async function convertLeadToCompanyTransaction({
  lead,
  company,
  branchName,
  adminUser,
}) {
  if (!lead) throw new Error('Ariza topilmadi');
  if (lead.status === 'DONE' || lead.companyId) {
    throw new Error('Ushbu ariza allaqachon yakunlangan va kompaniyaga aylantirilgan');
  }
  if (lead.managerNote && lead.managerNote.includes('Kompaniyaga aylantirildi')) {
    throw new Error('Ushbu arizadan allaqachon kompaniya yaratilgan');
  }

  const createAdmin = Boolean(adminUser?.login);
  const res = await platformLeadsApi.convert(lead.id, {
    companyName: company.name,
    phone: company.phone,
    legalName: company.legalName,
    tin: company.tin,
    businessType: company.businessType,
    regionCode: company.regionCode,
    districtCode: company.districtCode,
    branchName: branchName || 'Asosiy filial',
    createAdmin,
    adminName: adminUser?.name,
    adminLogin: adminUser?.login,
    adminEmail: adminUser?.email || lead.email,
    adminPassword: adminUser?.password,
    markDone: true,
  });
  const data = res?.data || {};
  return {
    companyId: data.companyId,
    companyLoginCode: data.companyLoginCode,
    storeId: data.storeId,
    adminCreated: Boolean(data.adminCreated),
    credentials: data.adminCreated
      ? {
          username: data.adminUsername,
          password: data.adminPassword,
          companyLoginCode: data.companyLoginCode || null,
          role: 'ADMIN',
        }
      : null,
  };
}
