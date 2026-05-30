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

// Internal token pair (camelCase — used for local storage and Spotify API)
export interface TokenPair {
  accessToken: string
  refreshToken: string
}

// Go backend returns capitalized field names (no json tags in the struct)
export interface ServerTokens {
  AccessToken: string
  RefreshToken: string
}

export interface ServerUser {
  Email: string
  Tokens: ServerTokens
}

export interface Session {
  Id: string
  Host: ServerUser
  Guest: ServerUser
  CreatedAt: string
  UpdatedAt: string
}

// What we persist in sessionStorage for the auth flow
// Discriminated union so Callback.tsx knows which path to take
export type PendingAuth =
  | { type: 'host'; sessionId: string; hostEmail: string; guestEmail: string }
  | { type: 'guest'; sessionId: string; guestEmail: string }
