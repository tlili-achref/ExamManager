export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const TOKEN_KEY = 'exammanager_token'
const USER_KEY = 'exammanager_user'

let memoryToken: string | null = localStorage.getItem(TOKEN_KEY)
let unauthorizedHandler: (() => void) | null = null

export interface AuthUser {
  id: number
  email: string
  full_name: string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

export function setSession(token: string, user: AuthUser) {
  memoryToken = token
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getToken(): string | null {
  if (!memoryToken) {
    memoryToken = localStorage.getItem(TOKEN_KEY)
  }
  return memoryToken
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function clearSession() {
  memoryToken = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers || {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })

  if (res.status === 401 && !path.startsWith('/auth/login')) {
    clearSession()
    if (unauthorizedHandler) unauthorizedHandler()
    throw new Error('Session expirée. Veuillez vous reconnecter.')
  }

  if (!res.ok) {
    let msg = `Erreur HTTP ${res.status}`
    try {
      const err = await res.json()
      msg = err.message || err.detail || msg
    } catch {
      // ignore json parse failure
    }
    throw new Error(msg)
  }

  if (res.status === 204) {
    return undefined as T
  }
  return res.json() as Promise<T>
}
