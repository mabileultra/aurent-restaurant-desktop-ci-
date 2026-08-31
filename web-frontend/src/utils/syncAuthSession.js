import axios from 'axios';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { normalizeCompanyLoginCode } from './authLogin';
import { isJwtExpired } from './jwtToken';
import { forceAuthReLogin } from './authSessionExpiry';

/** Подтянуть с сервера актуальные allowedModules и обновить JWT. */
export async function syncAuthSession() {
  const { token, user } = useAuthStore.getState();
  if (!token || token.split('.').length !== 3) return null;

  if (isJwtExpired(token)) {
    forceAuthReLogin();
    return null;
  }

  try {
    // Напрямую через axios — без logout в interceptor при сбое refresh.
    const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, null, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: api.defaults.timeout ?? 15_000,
    });
    const { token: newToken, ...profile } = res.data;
    const companyLoginCode =
      normalizeCompanyLoginCode(profile.companyLoginCode)
      || normalizeCompanyLoginCode(user?.companyLoginCode);
    useAuthStore.getState().setAuth(newToken, {
      ...profile,
      ...(companyLoginCode ? { companyLoginCode } : {}),
    });
    return profile;
  } catch (err) {
    if (isJwtExpired(token) || err?.response?.status === 400) {
      forceAuthReLogin();
    }
    return null;
  }
}
