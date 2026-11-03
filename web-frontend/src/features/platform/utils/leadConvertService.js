/**
 * leadConvertService.js
 * Multi-step transaction runner for converting a lead into a company,
 * creating default branch/store, provisioning admin user, and linking business type.
 */

import { companyApi } from '../../../api/company.api';
import { storeApi } from '../../../api/store.api';
import { userApi } from '../../../api/user.api';
import { companyBusinessTypeApi } from '../../../api/companyBusinessType.api';
import { platformBusinessTypeApi } from '../../../api/platform/businessType.api';
import { platformLeadsApi } from '../../../api/platform/leads.api';
import { appendLeadTimelineEvent } from './leadTimelineUtils';

export async function convertLeadToCompanyTransaction({
  lead,
  company,
  branchName,
  adminUser,
  markDone = true,
  author = 'Administrator',
}) {
  if (!lead) throw new Error('Ariza topilmadi');
  if (lead.status === 'DONE') {
    throw new Error('Ushbu ariza allaqachon yakunlangan va kompaniyaga aylantirilgan');
  }

  // 1. Create Company
  const companyRes = await companyApi.create(company);
  const companyId = companyRes?.data?.id;
  if (!companyId) {
    throw new Error('Kompaniya yaratilmadi');
  }

  // 2. Assign Business Type constructor
  if (company.businessType) {
    try {
      const typesRes = await platformBusinessTypeApi.list().catch(() => null);
      const typesList = typesRes?.data || [];
      const matched = typesList.find((bt) => bt.code === company.businessType);
      if (matched?.id) {
        await companyBusinessTypeApi.assign(companyId, {
          typeIds: [matched.id],
          defaultTypeId: matched.id,
        }).catch(() => {});
      }
    } catch {
      // Non-blocking fallback
    }
  }

  // 3. Create Branch / Store
  let storeId = null;
  if (branchName) {
    try {
      const storeRes = await storeApi.create({
        companyId,
        name: branchName,
        businessType: company.businessType || 'UNIVERSAL',
        active: true,
      });
      storeId = storeRes?.data?.id ?? null;
    } catch (err) {
      console.error('Filial yaratishda xatolik:', err);
    }
  }

  // 4. Create Admin User
  let adminCreated = false;
  if (adminUser?.login) {
    try {
      await userApi.create({
        companyId: Number(companyId),
        username: adminUser.login,
        password: 'AdminPassword123!',
        firstName: adminUser.name || 'Admin',
        lastName: '—',
        email: `${adminUser.login}@pos.internal`,
        role: 'ADMIN',
        active: true,
        storeIds: storeId ? [Number(storeId)] : [],
        ...(company.phone ? { phone: company.phone } : {}),
      });
      adminCreated = true;
    } catch (err) {
      console.error('Admin yaratishda xatolik:', err);
    }
  }

  // 5. Update Lead Status & Timeline Note
  if (markDone) {
    const details = [
      `Kompaniya: «${company.name}» (ID: ${companyId})`,
      branchName ? `Filial: «${branchName}»` : null,
      adminCreated ? `Admin: «${adminUser.login}»` : null,
    ].filter(Boolean).join(', ');

    const note = appendLeadTimelineEvent(
      lead.managerNote,
      {
        type: 'status_change',
        author,
        text: `Kompaniyaga aylantirildi. ${details}. Holat: Yakunlangan`,
      },
      { leadCreatedAt: lead.createdAt }
    );

    await platformLeadsApi.update(lead.id, { status: 'DONE', managerNote: note });
  }

  return { companyId, storeId, adminCreated };
}
