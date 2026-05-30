import { useState, type FormEvent } from 'react'
import { config } from '../config'
import { savePendingAuth } from '../utils/storage'

function generateSessionId(): string {
  return crypto.randomUUID()
}

export default function Home() {
  const [hostEmail, setHostEmail] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!hostEmail || !guestEmail) {
      setError('Both emails are required.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const sessionId = generateSessionId()

      savePendingAuth({ sessionId, hostEmail, guestEmail })

      const params = new URLSearchParams({
        client_id: config.spotifyClientId,
        response_type: 'code',
        redirect_uri: config.spotifyRedirectUri,
        scope: config.spotifyScopes,
        show_dialog: 'false',
      })

      window.location.href = `https://accounts.spotify.com/authorize?${params}`
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Shuffler<span className="text-spotify-green">ion</span>
          </h1>
          <p className="text-spotify-muted mt-2">Music for two — shuffle your likes together</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="block text-sm text-spotify-muted mb-1.5">Your email</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={hostEmail}
              onChange={(e) => setHostEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-spotify-muted mb-1.5">
              Partner's email
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="partner@example.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <span className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
            ) : (
              <>
                <SpotifyIcon />
                Connect with Spotify
              </>
            )}
          </button>

          <p className="text-xs text-spotify-muted text-center">
            You'll authorize your Spotify account. Your partner will receive a link to authorize theirs.
          </p>
        </form>
      </div>
    </div>
  )
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}
