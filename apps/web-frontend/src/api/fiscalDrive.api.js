import { api } from './client';

export const fiscalDriveApi = {
  getAdminSettings: (cashRegisterId) =>
    api.get(`/admin/cash-registers/${cashRegisterId}/fiscal-drive`),
  saveAdminSettings: (cashRegisterId, payload) =>
    api.put(`/admin/cash-registers/${cashRegisterId}/fiscal-drive`, payload),
};
