import { z } from 'zod';
import { formatUzPhone, digitsAfter998, isCompleteUzPhone } from '../../../../utils/phoneUz';

export function buildStoreFormSchema(t, { isCreate, showCompanySelect }) {
  return z.object({
    name: z.string().min(1, t('validation.fieldRequired', { field: t('stores.colName') })),
    address: z.string().optional(),
    regionCode: isCreate ? z.string().min(1, t('validation.fieldRequired', { field: t('geo.region') })) : z.string().optional(),
    districtCode: isCreate ? z.string().min(1, t('validation.fieldRequired', { field: t('geo.district') })) : z.string().optional(),
    phone: z.string().optional().refine(
      (val) => !val || digitsAfter998(val).length === 0 || isCompleteUzPhone(val),
      { message: t('validation.phoneComplete', { defaultValue: 'Telefon raqamini to‘liq kiriting (+998 XX XXX-XX-XX)' }) }
    ),
    code: z.string().optional(),
    companyId: showCompanySelect ? z.string().min(1, t('validation.fieldRequired', { field: t('stores.colCompany') })) : z.string().optional(),
    businessType: z.string().min(1, t('validation.fieldRequired', { field: t('stores.colBusinessType') })),
    businessTypeId: z.string().optional(),
    active: z.boolean().optional(),
  }).superRefine((data, ctx) => {
    const hasRegion = Boolean(data.regionCode?.trim());
    const hasDistrict = Boolean(data.districtCode?.trim());
    if (hasRegion !== hasDistrict) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasRegion ? ['districtCode'] : ['regionCode'],
        message: t('validation.fieldRequired', { field: hasRegion ? t('geo.district') : t('geo.region') }),
      });
    }
  });
}

export function buildStoreSubmitPayload(data, isCreate) {
  const regionCode = data.regionCode?.trim() || '';
  const districtCode = data.districtCode?.trim() || '';
  const phoneDigits = digitsAfter998(data.phone);
  const payload = {
    name: data.name.trim(),
    address: data.address?.trim() || null,
    phone: phoneDigits ? formatUzPhone(data.phone) : null,
    code: data.code?.trim() || null,
    companyId: data.companyId ? Number(data.companyId) : undefined,
    businessType: data.businessType,
    businessTypeId: data.businessTypeId ? Number(data.businessTypeId) : undefined,
    active: data.active,
  };
  if ((regionCode && districtCode) || isCreate) {
    payload.regionCode = regionCode;
    payload.districtCode = districtCode;
  }
  return payload;
}
