import { useState, useEffect, useRef } from 'react'

export function useSpotifyPlayer(accessToken: string | null) {
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [sdkReady, setSdkReady] = useState(false)

  // Keep a ref so getOAuthToken always uses the latest token
  // without needing to recreate the player on every token refresh
  const tokenRef = useRef<string | null>(accessToken)
  useEffect(() => {
    tokenRef.current = accessToken
  }, [accessToken])

  // Load the SDK script once
  useEffect(() => {
    if (document.getElementById('spotify-sdk')) {
      if (window.Spotify) setSdkReady(true)
      return
    }
    window.onSpotifyWebPlaybackSDKReady = () => setSdkReady(true)
    const script = document.createElement('script')
    script.id = 'spotify-sdk'
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  // Create and connect the player once the SDK is ready and we have a token
  useEffect(() => {
    if (!sdkReady || !accessToken) return

    const p = new window.Spotify.Player({
      name: 'Shufflerion',
      getOAuthToken: (cb) => {
        if (tokenRef.current) cb(tokenRef.current)
      },
      volume: 0.5,
    })

    p.addListener('ready', ({ device_id }) => {
      setDeviceId(device_id)
    })

    p.addListener('not_ready', () => {
      setDeviceId(null)
    })

    p.addListener('initialization_error', ({ message }) => {
      console.error('SDK initialization error:', message)
    })

    p.addListener('authentication_error', ({ message }) => {
      console.error('SDK auth error:', message)
    })

    p.connect()
    setPlayer(p)

    return () => {
      p.disconnect()
    }
    // Only create the player once (when SDK + first token are both ready)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady, !!accessToken])

  return { player, deviceId }
}
