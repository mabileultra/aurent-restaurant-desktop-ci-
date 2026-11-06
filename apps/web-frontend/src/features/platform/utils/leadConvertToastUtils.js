import toast from 'react-hot-toast';

/**
 * Emits honest toast notifications based on lead convert transaction outcome.
 */
export function notifyConvertResult(res) {
  const errors = [];
  if (res?.storeError) errors.push(`filial (${res.storeError})`);
  if (res?.userError) errors.push(`admin (${res.userError})`);
  if (res?.businessTypeError) errors.push(`faoliyat turi (${res.businessTypeError})`);
  if (res?.leadUpdateError) errors.push(`ariza yangilash (${res.leadUpdateError})`);

  if (errors.length > 0) {
    toast.error(`Kompaniya yaratildi, ammo xatoliklar yuz berdi: ${errors.join('; ')}`);
    return;
  }

  if (res?.adminCreated && res?.storeId) {
    toast.success('Kompaniya, filial va admin muvaffaqiyatli yaratildi');
  } else if (res?.storeId) {
    toast.success('Kompaniya va filial muvaffaqiyatli yaratildi');
  } else {
    toast.success('Kompaniya muvaffaqiyatli yaratildi');
  }
}
