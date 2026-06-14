import { apiClient } from './client';
import type { AuthRequest, AuthResponse } from './types';

export async function login(request: AuthRequest): Promise<AuthResponse> {
  const payload = {
    username: request.username.trim(),
    password: request.password,
    ...(request.companyLoginCode?.trim()
      ? { companyLoginCode: request.companyLoginCode.trim().toUpperCase() }
      : {}),
  };
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}
