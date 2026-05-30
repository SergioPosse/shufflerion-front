import { useEffect, useRef } from 'react'
import type { TokenPair } from '../types'
import { refreshAccessToken } from '../services/spotifyApi'
import { saveHostTokens, updateHostAccessToken } from '../utils/storage'
import { config } from '../config'

interface UseTokenRefreshOptions {
  hostTokens: TokenPair | null
  onHostTokenRefreshed: (newToken: string) => void
}

export function useTokenRefresh({ hostTokens, onHostTokenRefreshed }: UseTokenRefreshOptions) {
  const hostTokensRef = useRef<TokenPair | null>(hostTokens)
  useEffect(() => { hostTokensRef.current = hostTokens }, [hostTokens])

  useEffect(() => {
    const interval = setInterval(async () => {
      if (hostTokensRef.current) {
        try {
          const refreshed = await refreshAccessToken(hostTokensRef.current)
          hostTokensRef.current = refreshed
          saveHostTokens(refreshed)
          updateHostAccessToken(refreshed.accessToken)
          onHostTokenRefreshed(refreshed.accessToken)
        } catch (err) {
          console.error('Host token refresh failed:', err)
        }
      }
    }, config.tokenRefreshInterval)

    return () => clearInterval(interval)
  }, [onHostTokenRefreshed])
}
