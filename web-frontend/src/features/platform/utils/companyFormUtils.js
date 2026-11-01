export const emptyForm = () => ({
  name: '',
  legalName: '',
  tin: '',
  address: '',
  regionCode: '',
  districtCode: '',
  phone: '',
  active: true,
  businessType: 'UNIVERSAL',
  businessTypeIds: [],
  defaultBusinessTypeId: null,
});

export function toggleFormBusinessType(prev, typeId, constructorTypes) {
  const exists = prev.businessTypeIds.includes(typeId);
  const businessTypeIds = exists
    ? prev.businessTypeIds.filter((id) => id !== typeId)
    : [...prev.businessTypeIds, typeId];
  let defaultBusinessTypeId = prev.defaultBusinessTypeId;
  if (!businessTypeIds.includes(defaultBusinessTypeId)) {
    defaultBusinessTypeId = businessTypeIds[0] ?? null;
  }
  if (!exists && businessTypeIds.length === 1) {
    defaultBusinessTypeId = typeId;
  }
  const defaultType = constructorTypes.find((bt) => bt.id === defaultBusinessTypeId);
  return {
    ...prev,
    businessTypeIds,
    defaultBusinessTypeId,
    businessType: defaultType?.code ?? prev.businessType,
  };
}
