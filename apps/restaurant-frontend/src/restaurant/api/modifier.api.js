import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstModifierApi = {
  listGroups: (storeId) => api.get(rst(`/stores/${storeId}/modifier-groups`)),
  listForMenuItem: (itemId) => api.get(rst(`/menu-items/${itemId}/modifier-groups`)),
  createGroup: (storeId, data) => api.post(rst(`/stores/${storeId}/modifier-groups`), data),
  updateGroup: (groupId, data) => api.put(rst(`/modifier-groups/${groupId}`), data),
  deactivateGroup: (groupId) => api.delete(rst(`/modifier-groups/${groupId}`)),
  createOption: (groupId, data) => api.post(rst(`/modifier-groups/${groupId}/options`), data),
  updateOption: (optionId, data) => api.put(rst(`/modifier-options/${optionId}`), data),
  deactivateOption: (optionId) => api.delete(rst(`/modifier-options/${optionId}`)),
};
