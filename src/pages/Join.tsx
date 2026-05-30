import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { config } from '../config'
import { savePendingAuth } from '../utils/storage'

export default function Join() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  const sessionId = searchParams.get('sessionId')
  const guestEmail = searchParams.get('guestEmail')

  useEffect(() => {
    if (!sessionId || !guestEmail) {
      setError('Invalid invite link — missing session ID or email.')
      return
    }

    savePendingAuth({ type: 'guest', sessionId, guestEmail })

    const params = new URLSearchParams({
      client_id: config.spotifyClientId,
      response_type: 'code',
      redirect_uri: config.spotifyRedirectUri,
      scope: config.spotifyScopes,
      show_dialog: 'false',
    })

    // Small delay so the user sees the screen before being redirected
    const timer = setTimeout(() => {
      window.location.href = `https://accounts.spotify.com/authorize?${params}`
    }, 1500)

    return () => clearTimeout(timer)
  }, [sessionId, guestEmail])

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4 overflow-y-auto">
        <div className="card max-w-md text-center space-y-3">
          <p className="text-2xl">⚠️</p>
          <p className="text-white font-semibold">Invalid invite link</p>
          <p className="text-spotify-muted text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex items-center justify-center p-4 overflow-y-auto">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Shuffler<span className="text-spotify-green">ion</span>
          </h1>
          <p className="text-spotify-muted mt-2">You've been invited to listen together</p>
        </div>

        {guestEmail && (
          <p className="text-white">
            Joining as <span className="text-spotify-green">{guestEmail}</span>
          </p>
        )}

        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-spotify-green border-t-transparent rounded-full animate-spin" />
          <p className="text-spotify-muted text-sm">Connecting to Spotify…</p>
        </div>
      </div>
    </div>
  )
}
