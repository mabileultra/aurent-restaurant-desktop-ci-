/**
 * leadConvertService.js
 * Multi-step transaction runner for converting a lead into a company,
 * creating default branch/store, provisioning admin user with secure credentials,
 * and linking business type via setForCompany.
 */

import { companyApi } from '../../../api/company.api';
import { storeApi } from '../../../api/store.api';
import { userApi } from '../../../api/user.api';
import { companyBusinessTypeApi } from '../../../api/companyBusinessType.api';
import { platformBusinessTypeApi } from '../../../api/platform/businessType.api';
import { platformLeadsApi } from '../../../api/platform/leads.api';
import { formatApiErrorMessage } from '../../../utils/apiErrorParser';
import { appendLeadTimelineEvent } from './leadTimelineUtils';
import { generateSecurePassword } from './passwordGenerator';

const BUSINESS_TYPE_NAMES_UZ = {
  PHARMACY: 'Dorixona',
  RESTAURANT: 'Restoran',
  CANTEEN: 'Oshxona / bufet',
  RETAIL: 'Chakana savdo',
  UNIVERSAL: 'Universal',
  GROCERY: 'Oziq-ovqat',
  CLOTHING: 'Kiyim-kechak',
  CONSTRUCTION: 'Qurilish materiallari',
  AUTO_PARTS: 'Avto ehtiyot qismlari',
  OTHER: 'Boshqa',
};

export function resolveBusinessTypeName(code) {
  if (!code) return '';
  return BUSINESS_TYPE_NAMES_UZ[String(code).toUpperCase().trim()] || code;
}

export async function convertLeadToCompanyTransaction({
  lead,
  company,
  branchName,
  adminUser,
  author = 'Administrator',
}) {
  if (!lead) throw new Error('Ariza topilmadi');
  if (lead.status === 'DONE') {
    throw new Error('Ushbu ariza allaqachon yakunlangan va kompaniyaga aylantirilgan');
  }
  if (lead.managerNote && lead.managerNote.includes('Kompaniyaga aylantirildi')) {
    throw new Error('Ushbu arizadan allaqachon kompaniya yaratilgan');
  }

  // 1. Create Company
  const companyRes = await companyApi.create(company);
  const companyId = companyRes?.data?.id;
  const companyLoginCode = companyRes?.data?.loginCode;
  if (!companyId) {
    throw new Error('Kompaniya yaratilmadi');
  }

  // Pre-emptively record DONE to prevent duplicate company creation on retries
  const initialNote = appendLeadTimelineEvent(
    lead.managerNote,
    {
      type: 'status_change',
      author,
      text: `Kompaniyaga aylantirildi. Kompaniya: «${company.name}» (ID: ${companyId}). Holat: Yakunlangan`,
    },
    { leadCreatedAt: lead.createdAt }
  );
  try {
    await platformLeadsApi.update(lead.id, { status: 'DONE', managerNote: initialNote });
  } catch (leadPreErr) {
    console.warn('Arizani dastlabki yakunlashda ogohlantirish:', leadPreErr);
  }

  // 2. Assign Business Type constructor
  let businessTypeError = null;
  if (company.businessType) {
    try {
      const typesRes = await platformBusinessTypeApi.list();
      const typesList = typesRes?.data || [];
      const matched = typesList.find((bt) => bt.code === company.businessType);
      if (matched?.id) {
        await companyBusinessTypeApi.setForCompany(companyId, {
          businessTypeIds: [matched.id],
          defaultBusinessTypeId: matched.id,
        });
      } else {
        businessTypeError = `Faoliyat turi topilmadi (${company.businessType})`;
      }
    } catch (err) {
      businessTypeError = formatApiErrorMessage(err, 'Faoliyat turini biriktirishda xatolik');
      console.error('Faoliyat turini bog\'lashda xatolik:', err);
    }
  }

  // 3. Create Branch / Store
  let storeId = null;
  let storeError = null;
  if (branchName) {
    try {
      const storeRes = await storeApi.create({
        companyId,
        name: branchName,
        businessType: company.businessType || 'UNIVERSAL',
        regionCode: company.regionCode,
        districtCode: company.districtCode,
        active: true,
      });
      storeId = storeRes?.data?.id ?? null;
    } catch (err) {
      storeError = formatApiErrorMessage(err, 'Filial yaratishda xatolik');
      console.error('Filial yaratishda xatolik:', err);
    }
  }

  // 4. Create Admin User
  let adminCreated = false;
  let userError = null;
  let finalPassword = null;
  if (adminUser?.login) {
    const emailToUse = adminUser.email?.trim() || lead.email?.trim();
    if (!emailToUse) {
      userError = 'Admin uchun haqiqiy email manzili kiritilmadi';
    } else {
      finalPassword = adminUser.password || generateSecurePassword(12);
      try {
        await userApi.create({
          companyId: Number(companyId),
          username: adminUser.login,
          password: finalPassword,
          firstName: adminUser.name || 'Admin',
          lastName: '—',
          email: emailToUse,
          role: 'ADMIN',
          active: true,
          storeIds: storeId ? [Number(storeId)] : [],
          ...(company.phone ? { phone: company.phone } : {}),
        });
        adminCreated = true;
      } catch (err) {
        userError = formatApiErrorMessage(err, 'Admin yaratishda xatolik');
        console.error('Admin yaratishda xatolik:', err);
      }
    }
  }

  // 5. Final Lead Timeline Update
  const details = [
    `Kompaniya: «${company.name}» (ID: ${companyId})`,
    branchName ? (storeId ? `Filial: «${branchName}»` : `Filial xatosi: ${storeError}`) : null,
    adminUser?.login ? (adminCreated ? `Admin: «${adminUser.login}»` : `Admin xatosi: ${userError}`) : null,
    businessTypeError ? `Faoliyat turi xatosi: ${businessTypeError}` : (company.businessType ? `Faoliyat turi: «${resolveBusinessTypeName(company.businessType)}»` : null),
  ].filter(Boolean).join(', ');

  const finalNote = appendLeadTimelineEvent(
    lead.managerNote,
    {
      type: 'status_change',
      author,
      text: `Kompaniyaga aylantirildi. ${details}. Holat: Yakunlangan`,
    },
    { leadCreatedAt: lead.createdAt }
  );

  let leadUpdateError = null;
  try {
    await platformLeadsApi.update(lead.id, { status: 'DONE', managerNote: finalNote });
  } catch (err) {
    leadUpdateError = err.response?.data?.message || err.message || 'Ariza holatini yangilashda xatolik';
  }

  const credentials = adminCreated
    ? {
        username: adminUser.login,
        password: finalPassword,
        companyLoginCode: companyLoginCode || null,
        role: 'ADMIN',
      }
    : null;

  return {
    companyId,
    companyLoginCode,
    storeId,
    adminCreated,
    credentials,
    storeError,
    userError,
    businessTypeError,
    leadUpdateError,
  };
}
