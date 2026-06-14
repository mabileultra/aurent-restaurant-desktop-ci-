import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_TIMEOUT_MS } from '../config/api';
import { getApiBaseUrl } from '../config/serverUrl';
import { getToken, setSession, clearSession } from '../storage/session';

export const apiClient = axios.create({
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  config.baseURL = getApiBaseUrl();
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const token = await getToken();
      if (!token || token.split('.').length !== 3) {
        await clearSession();
        return Promise.reject(error);
      }
      try {
        const res = await axios.post(
          `${getApiBaseUrl()}/auth/refresh`,
          null,
          { headers: { Authorization: `Bearer ${token}` }, timeout: API_TIMEOUT_MS },
        );
        const { token: newToken, ...profile } = res.data;
        await setSession(newToken, profile);
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        await clearSession();
      }
    }
    return Promise.reject(error);
  },
);
