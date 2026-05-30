import { config } from '../config'
import type { Session, TokenPair } from '../types'

const base = config.backendUrl

// Exchange a single Spotify auth code for tokens.
// Backend also accepts a second code; we send just the host code here.
export async function exchangeCode(code: string, codeVerifier: string): Promise<TokenPair> {
  // The backend /auth/tokens endpoint does the Spotify token exchange server-side.
  // We send both code and codeVerifier so the backend can handle PKCE exchange.
  // If the backend doesn't support PKCE yet, we fall back to direct Spotify exchange.
  try {
    const res = await fetch(`${base}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code1: code, code_verifier: codeVerifier }),
    })
    if (!res.ok) throw new Error(`auth/tokens failed: ${res.status}`)
    const data = (await res.json()) as Array<{ access_token: string; refresh_token: string }>
    const first = data[0]
    if (!first) throw new Error('Empty token response')
    return { accessToken: first.access_token, refreshToken: first.refresh_token }
  } catch {
    // Fallback: exchange directly with Spotify using PKCE (no client_secret needed)
    return exchangeCodeWithSpotify(code, codeVerifier)
  }
}

async function exchangeCodeWithSpotify(code: string, codeVerifier: string): Promise<TokenPair> {
  const body = new URLSearchParams({
    client_id: config.spotifyClientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.spotifyRedirectUri,
    code_verifier: codeVerifier,
  })
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`Spotify token exchange failed: ${res.status}`)
  const data = (await res.json()) as { access_token: string; refresh_token: string }
  return { accessToken: data.access_token, refreshToken: data.refresh_token }
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
