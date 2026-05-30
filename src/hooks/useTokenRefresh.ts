import { useEffect, useRef } from 'react'
import type { TokenPair } from '../types'
import { refreshAccessToken } from '../services/spotifyApi'
import { saveHostTokens } from '../utils/storage'
import { updateSession } from '../services/backendApi'
import { config } from '../config'

interface UseTokenRefreshOptions {
  hostTokens: TokenPair | null
  guestRefreshToken: string | null
  sessionId: string | null
  guestEmail: string | null
  onHostTokenRefreshed: (newToken: string) => void
  onGuestTokenRefreshed: (newToken: string) => void
}

export function useTokenRefresh({
  hostTokens,
  guestRefreshToken,
  sessionId,
  guestEmail,
  onHostTokenRefreshed,
  onGuestTokenRefreshed,
}: UseTokenRefreshOptions) {
  const hostTokensRef = useRef<TokenPair | null>(hostTokens)
  const guestRefreshTokenRef = useRef<string | null>(guestRefreshToken)
  const sessionIdRef = useRef<string | null>(sessionId)
  const guestEmailRef = useRef<string | null>(guestEmail)

  useEffect(() => { hostTokensRef.current = hostTokens }, [hostTokens])
  useEffect(() => { guestRefreshTokenRef.current = guestRefreshToken }, [guestRefreshToken])
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])
  useEffect(() => { guestEmailRef.current = guestEmail }, [guestEmail])

  useEffect(() => {
    const interval = setInterval(async () => {
      // Refresh host token
      if (hostTokensRef.current) {
        try {
          const refreshed = await refreshAccessToken(hostTokensRef.current)
          hostTokensRef.current = refreshed
          saveHostTokens(refreshed)
          onHostTokenRefreshed(refreshed.accessToken)
        } catch (err) {
          console.error('Host token refresh failed:', err)
        }
      }

      // Refresh guest token and update session in MongoDB
      if (guestRefreshTokenRef.current && sessionIdRef.current && guestEmailRef.current) {
        try {
          const refreshed = await refreshAccessToken({
            accessToken: '',
            refreshToken: guestRefreshTokenRef.current,
          })
          guestRefreshTokenRef.current = refreshed.refreshToken
          await updateSession(sessionIdRef.current, guestEmailRef.current, refreshed)
          onGuestTokenRefreshed(refreshed.accessToken)
        } catch (err) {
          console.error('Guest token refresh failed:', err)
        }
      }
    }, config.tokenRefreshInterval)

    return () => clearInterval(interval)
  }, [onHostTokenRefreshed, onGuestTokenRefreshed])
}
