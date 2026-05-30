export const config = {
  spotifyClientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID as string,
  spotifyRedirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string,
  // Scopes needed: playback + reading liked songs + account info
  spotifyScopes: [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-library-read',
    'user-read-playback-state',
    'user-modify-playback-state',
  ].join(' '),
  backendUrl: import.meta.env.VITE_BACKEND_URL as string,
  authFrontUrl: import.meta.env.VITE_AUTH_FRONT_URL as string,
  tokenRefreshInterval: 55 * 60 * 1000, // 55 min, before Spotify's 60-min expiry
}
