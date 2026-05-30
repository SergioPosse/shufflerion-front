// Song shape as returned by backend POST /songs/random
// Note: capitalized field names — that's what the Go backend returns
export interface Song {
  Title: string
  Artist: string
  Url: string    // Spotify URI: "spotify:track:..."
  Image: string  // Album cover URL
  Duration: number // ms
  Explicit: boolean
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface SessionUser {
  email: string
  tokens: TokenPair
}

export interface Session {
  id: string
  host: SessionUser
  guest: SessionUser
  createdAt: string
  updatedAt: string
}

// What we persist in sessionStorage for the auth flow
// Discriminated union so Callback.tsx knows which path to take
export type PendingAuth =
  | { type: 'host'; sessionId: string; hostEmail: string; guestEmail: string }
  | { type: 'guest'; sessionId: string; guestEmail: string }
