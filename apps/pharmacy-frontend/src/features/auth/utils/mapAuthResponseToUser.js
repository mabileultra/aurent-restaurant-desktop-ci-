/** Map Identity AuthResponse JSON to local session user shape. */
export function mapAuthResponseToUser(data) {
  if (!data) return { role: 'CASHIER' };
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    patronymic: data.patronymic,
    fullName: data.fullName,
    role: data.role,
    companyId: data.companyId,
    companyLoginCode: data.companyLoginCode,
    storeIds: data.storeIds || [],
    allowedModules: data.allowedModules || [],
    moduleAccessCustom: !!data.moduleAccessCustom,
  };
}
