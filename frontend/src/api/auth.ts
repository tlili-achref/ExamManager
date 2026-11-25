import { apiFetch, AuthUser, clearSession, setSession } from './client'

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: AuthUser
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setSession(data.access_token, data.user)
  return data
}

export function me(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me')
}

export function logout() {
  clearSession()
}
