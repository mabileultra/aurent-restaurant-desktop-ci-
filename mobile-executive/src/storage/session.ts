import * as SecureStore from 'expo-secure-store';
import type { AuthResponse } from '../api/types';

const TOKEN_KEY = 'aurent_exec_token';
const USER_KEY = 'aurent_exec_user';
const REMEMBER_KEY = 'aurent_exec_remember';
const SERVER_KEY = 'aurent_exec_server';

export type StoredUser = Omit<AuthResponse, 'token'>;

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getUser(): Promise<StoredUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export async function setSession(token: string, user: StoredUser): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function setRememberDevice(value: boolean): Promise<void> {
  await SecureStore.setItemAsync(REMEMBER_KEY, value ? '1' : '0');
}

export async function getRememberDevice(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(REMEMBER_KEY);
  return v === '1';
}

export async function setSavedServerUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync(SERVER_KEY, url);
}

export async function getSavedServerUrl(): Promise<string | null> {
  return SecureStore.getItemAsync(SERVER_KEY);
}
