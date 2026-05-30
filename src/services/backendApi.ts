import { config } from '../config'
import type { Session, TokenPair } from '../types'

const base = config.backendUrl

// Exchange a Spotify auth code for tokens via the backend (keeps client_secret on the server)
export async function exchangeCode(code: string): Promise<TokenPair> {
  const res = await fetch(`${base}/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code1: code }),
  })
  if (!res.ok) throw new Error(`auth/tokens failed: ${res.status}`)
  const data = (await res.json()) as Array<{ access_token: string; refresh_token: string }>
  const first = data[0]
  if (!first) throw new Error('Empty token response')
  return { accessToken: first.access_token, refreshToken: first.refresh_token }
}

export async function createSession(
  sessionId: string,
  hostEmail: string,
  hostTokens: TokenPair,
): Promise<Session> {
  const res = await fetch(`${base}/session/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: sessionId,
      host: {
        email: hostEmail,
        tokens: {
          accessToken: hostTokens.accessToken,
          refreshToken: hostTokens.refreshToken,
        },
      },
    }),
  })
  if (!res.ok) throw new Error(`session/create failed: ${res.status}`)
  return res.json() as Promise<Session>
}

export async function getSession(sessionId: string): Promise<Session> {
  const res = await fetch(`${base}/session?id=${encodeURIComponent(sessionId)}`)
  if (!res.ok) throw new Error(`session/get failed: ${res.status}`)
  return res.json() as Promise<Session>
}

export async function fetchSongs(
  accessToken1: string,
  accessToken2: string,
): Promise<import('../types').Song[]> {
  const res = await fetch(`${base}/songs/random`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token1: accessToken1, access_token2: accessToken2 }),
  })
  if (!res.ok) throw new Error(`songs/random failed: ${res.status}`)
  return res.json() as Promise<import('../types').Song[]>
}
