import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { config } from '../config'
import { loadGuestEmail, loadHostTokens } from '../utils/storage'
import { getSession } from '../services/backendApi'

type Status = 'waiting' | 'connecting' | 'error'

export default function Waiting() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('connecting')
  const [copied, setCopied] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const ran = useRef(false)

  const guestEmail = loadGuestEmail()

  const origin = window.location.origin
  const inviteLink = `${origin}/join?sessionId=${sessionId}&guestEmail=${encodeURIComponent(guestEmail)}`

  const goToPlayer = useCallback(() => {
    navigate(`/player/${sessionId}`, { replace: true })
  }, [navigate, sessionId])

  useEffect(() => {
    if (ran.current || !sessionId) return
    ran.current = true

    // First: check if guest already joined before we started listening
    async function checkAlreadyJoined() {
      try {
        const session = await getSession(sessionId!)
        if (session.Guest?.Tokens?.AccessToken) {
          goToPlayer()
          return
        }
      } catch {
        // session may not exist yet, continue to websocket
      }
      connectWebSocket()
    }

    function connectWebSocket() {
      // wss for https origins, ws for localhost
      const wsBase = config.backendUrl
        .replace(/^https/, 'wss')
        .replace(/^http/, 'ws')

      const ws = new WebSocket(`${wsBase}/session/socket`)
      wsRef.current = ws

      ws.onopen = () => {
        setStatus('waiting')
        ws.send(JSON.stringify({ action: 'subscribe', sessionId }))
      }

      ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(event.data) as { event: string }
          if (msg.event === 'guest_joined') {
            goToPlayer()
          }
        } catch {
          // ignore malformed messages
        }
      }

      ws.onerror = () => setStatus('error')

      ws.onclose = () => {
        // If we closed before navigating, try to reconnect after a short delay
        if (document.visibilityState !== 'hidden') {
          setTimeout(connectWebSocket, 3000)
        }
      }
    }

    checkAlreadyJoined()

    return () => {
      wsRef.current?.close()
    }
  }, [sessionId, goToPlayer])

  // Validate that we have a valid host session before rendering
  const tokens = loadHostTokens()
  if (!tokens) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center space-y-3">
          <p className="text-white">Session not found.</p>
          <a href="/" className="btn-primary inline-block">Start over</a>
        </div>
      </div>
    )
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            Shuffler<span className="text-spotify-green">ion</span>
          </h1>
          <p className="text-spotify-muted mt-2">Waiting for your partner to join…</p>
        </div>

        {/* Animated indicator */}
        <div className="flex justify-center">
          {status === 'waiting' ? (
            <div className="flex gap-2 items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-3 h-3 bg-spotify-green rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          ) : status === 'connecting' ? (
            <div className="w-8 h-8 border-4 border-spotify-green border-t-transparent rounded-full animate-spin" />
          ) : (
            <p className="text-red-400 text-sm">Connection lost — retrying…</p>
          )}
        </div>

        {/* Invite link card */}
        <div className="card space-y-3">
          <p className="text-sm text-spotify-muted">
            Share this link with <span className="text-white">{guestEmail || 'your partner'}</span>:
          </p>

          <div className="flex gap-2">
            <input
              readOnly
              value={inviteLink}
              className="input-field text-xs flex-1 min-w-0"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={copyLink}
              className="btn-primary whitespace-nowrap text-sm py-2 px-4"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          <p className="text-xs text-spotify-muted">
            They'll connect their Spotify account and you'll both start listening automatically.
          </p>
        </div>

        <p className="text-center text-xs text-spotify-muted">
          Session ID: <span className="font-mono text-white">{sessionId}</span>
        </p>
      </div>
    </div>
  )
}
