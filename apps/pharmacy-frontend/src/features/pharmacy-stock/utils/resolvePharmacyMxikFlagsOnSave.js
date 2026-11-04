import { tasnifApi } from '../../../api';
import { applyMxikFlags } from './inferPharmacyMxikFlags';

export async function resolvePharmacyMxikFlagsOnSave(form) {
  const ikpu = String(form.ikpu || '').trim();
  if (ikpu.length < 10) return form;
  try {
    const res = await tasnifApi.search({ q: ikpu, lang: 'ru', page: 0, size: 1 });
    const item = (res.data?.items ?? res.data?.content ?? [])[0];
    const code = String(item?.mxik || item?.code || item?.ikpu || '').trim();
    if (!item || (code && code !== ikpu && !code.startsWith(ikpu) && !ikpu.startsWith(code))) {
      return form;
    }
    return applyMxikFlags(form, item);
  } catch {
    return form;
  }
}
