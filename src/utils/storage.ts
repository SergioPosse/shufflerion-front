import type { PendingAuth, TokenPair } from '../types'

const KEYS = {
  pendingAuth: 'shufflerion_pending_auth',
  hostTokens: 'shufflerion_host_tokens',
  sessionId: 'shufflerion_session_id',
} as const

export function savePendingAuth(data: PendingAuth): void {
  sessionStorage.setItem(KEYS.pendingAuth, JSON.stringify(data))
}

export function loadPendingAuth(): PendingAuth | null {
  const raw = sessionStorage.getItem(KEYS.pendingAuth)
  return raw ? (JSON.parse(raw) as PendingAuth) : null
}

export function clearPendingAuth(): void {
  sessionStorage.removeItem(KEYS.pendingAuth)
}

export function saveHostTokens(tokens: TokenPair): void {
  sessionStorage.setItem(KEYS.hostTokens, JSON.stringify(tokens))
}

export function loadHostTokens(): TokenPair | null {
  const raw = sessionStorage.getItem(KEYS.hostTokens)
  return raw ? (JSON.parse(raw) as TokenPair) : null
}

export function updateHostAccessToken(accessToken: string): void {
  const current = loadHostTokens()
  if (current) {
    saveHostTokens({ ...current, accessToken })
  }
}

export function saveSessionId(id: string): void {
  sessionStorage.setItem(KEYS.sessionId, id)
}

export function loadSessionId(): string | null {
  return sessionStorage.getItem(KEYS.sessionId)
}

export function clearSession(): void {
  Object.values(KEYS).forEach((k) => sessionStorage.removeItem(k))
}
