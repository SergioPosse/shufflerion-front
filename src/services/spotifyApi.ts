import { config } from '../config'
import type { TokenPair } from '../types'

const SPOTIFY_API = 'https://api.spotify.com/v1'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'

// Transfer playback to the SDK device before issuing play commands
export async function activateDevice(accessToken: string, deviceId: string): Promise<void> {
  await fetch(`${SPOTIFY_API}/me/player`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ device_ids: [deviceId], play: false }),
  })
}

// Play a specific Spotify URI on the SDK device
export async function playSong(
  accessToken: string,
  deviceId: string,
  uri: string,
): Promise<boolean> {
  const res = await fetch(`${SPOTIFY_API}/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris: [uri], position_ms: 0, offset: { position: 0 } }),
  })
  return res.ok
}

// Set volume (0–100)
export async function setSpotifyVolume(
  accessToken: string,
  deviceId: string,
  volume: number,
): Promise<void> {
  await fetch(
    `${SPOTIFY_API}/me/player/volume?volume_percent=${Math.round(volume)}&device_id=${deviceId}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )
}

// Refresh using PKCE flow — only client_id needed, no client_secret
export async function refreshAccessToken(tokens: TokenPair): Promise<TokenPair> {
  const body = new URLSearchParams({
    client_id: config.spotifyClientId,
    grant_type: 'refresh_token',
    refresh_token: tokens.refreshToken,
  })
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  const data = (await res.json()) as { access_token: string; refresh_token?: string }
  return {
    accessToken: data.access_token,
    // Spotify may rotate the refresh token; fall back to the old one if not
    refreshToken: data.refresh_token ?? tokens.refreshToken,
  }
}
