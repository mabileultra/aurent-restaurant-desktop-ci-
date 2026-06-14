import { getApiBaseUrl } from './serverUrl';

export const API_TIMEOUT_MS = 20_000;

export function API_BASE_URL(): string {
  return getApiBaseUrl();
}
