import { api } from './client';

export const geoApi = {
  regions: () => api.get('/geo/regions'),
  districts: (regionCode) => api.get(`/geo/regions/${encodeURIComponent(regionCode)}/districts`),
};
