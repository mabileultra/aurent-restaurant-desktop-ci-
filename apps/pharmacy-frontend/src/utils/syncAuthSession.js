import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { isJwtExpired } from './jwtToken';
import { isDesktopOfflineBridge } from '../services/offline/desktopOfflineBridge';
import { canRunOnlineSync } from '../services/offline/canRunOnlineSync';
import {
  clearAuthSessionForPublicOrProtected,
  isAuthRejectionError,
  isValidJwtFormat,
  refreshAuthSession,
} from './refreshAuthSession';

/** Подтянуть с сервера актуальные allowedModules и обновить JWT. */
export async function syncAuthSession() {
  const { token } = useAuthStore.getState();
  if (!isValidJwtFormat(token)) return null;

  if (isJwtExpired(token)) {
    clearAuthSessionForPublicOrProtected();
    return null;
  }

  if (isDesktopOfflineBridge() && !canRunOnlineSync()) {
    return null;
  }

  try {
    const result = await refreshAuthSession({
      expectedToken: token,
      baseURL: api.defaults.baseURL,
      timeout: api.defaults.timeout ?? 15_000,
    });
    return result?.profile ?? null;
  } catch (err) {
    if (!isAuthRejectionError(err) && isJwtExpired(token) && useAuthStore.getState().token) {
      clearAuthSessionForPublicOrProtected();
    }
    return null;
  }
}
