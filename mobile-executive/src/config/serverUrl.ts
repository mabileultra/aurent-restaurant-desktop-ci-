import Constants from 'expo-constants';
import { getSavedServerUrl } from '../storage/session';

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

export const DEFAULT_API_URL = 'https://www.aurent.uz/api/v1';

let runtimeBaseUrl =
  process.env.EXPO_PUBLIC_API_URL
  || extra?.apiUrl
  || DEFAULT_API_URL;

export function getApiBaseUrl(): string {
  return runtimeBaseUrl.replace(/\/$/, '');
}

export function setApiBaseUrl(url: string): void {
  runtimeBaseUrl = url.replace(/\/$/, '');
}

export async function hydrateApiBaseUrl(): Promise<string> {
  const saved = await getSavedServerUrl();
  if (saved?.trim()) {
    setApiBaseUrl(saved.trim());
  }
  return getApiBaseUrl();
}
