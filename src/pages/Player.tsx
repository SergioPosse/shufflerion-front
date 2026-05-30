import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { loadHostTokens, saveHostTokens } from '../utils/storage'
import { getSession, fetchSongs } from '../services/backendApi'
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer'
import { usePlayerState } from '../hooks/usePlayerState'
import { useTokenRefresh } from '../hooks/useTokenRefresh'
import NowPlaying from '../components/NowPlaying'
import PlayerControls from '../components/PlayerControls'
import VolumeControl from '../components/VolumeControl'
import SongList from '../components/SongList'
import type { Song, TokenPair, Session } from '../types'

type LoadState = 'loading' | 'ready' | 'error'

export default function Player() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [songs, setSongs] = useState<Song[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [hostTokens, setHostTokens] = useState<TokenPair | null>(null)
  const [hostAccessToken, setHostAccessToken] = useState<string | null>(null)

  const sessionRef = useRef<Session | null>(null)
  const hostTokensRef = useRef<TokenPair | null>(null)

  useEffect(() => { sessionRef.current = session }, [session])
  useEffect(() => { hostTokensRef.current = hostTokens }, [hostTokens])

  // Bootstrap: load session + songs
  useEffect(() => {
    if (!sessionId) return

    async function bootstrap() {
      try {
        // Get fresh session (has both host and guest tokens)
        const s = await getSession(sessionId!)
        setSession(s)

        // Host tokens: prefer sessionStorage (may have been refreshed), else use session
        const stored = loadHostTokens()
        const tokens: TokenPair = stored ?? s.host.tokens
        setHostTokens(tokens)
        setHostAccessToken(tokens.accessToken)

        // Fetch initial song batch
        const initialSongs = await fetchSongs(
          tokens.accessToken,
          s.guest.tokens.accessToken,
        )
        setSongs(initialSongs)
        setLoadState('ready')
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load session')
        setLoadState('error')
      }
    }

    bootstrap()
  }, [sessionId])

  // Fetch more songs when the current batch runs out
  const handleSongsExhausted = useCallback(async (): Promise<Song[]> => {
    if (!sessionRef.current || !hostTokensRef.current) return []
    const newSongs = await fetchSongs(
      hostTokensRef.current.accessToken,
      sessionRef.current.guest.tokens.accessToken,
    )
    setSongs(newSongs)
    return newSongs
  }, [])

  // Token refresh — updates hostAccessToken so the SDK getOAuthToken callback stays fresh
  const handleHostTokenRefreshed = useCallback((newToken: string) => {
    setHostAccessToken(newToken)
    if (hostTokensRef.current) {
      const updated = { ...hostTokensRef.current, accessToken: newToken }
      setHostTokens(updated)
      saveHostTokens(updated)
    }
  }, [])

  useTokenRefresh({
    hostTokens,
    onHostTokenRefreshed: handleHostTokenRefreshed,
  })

  const { player, deviceId } = useSpotifyPlayer(hostAccessToken)

  const {
    isPlaying,
    currentSongIndex,
    hasStarted,
    handleStart,
    handleNext,
    handlePrev,
    handleTogglePlay,
  } = usePlayerState({
    player,
    deviceId,
    accessToken: hostAccessToken,
    songs,
    onSongsExhausted: handleSongsExhausted,
  })

  if (loadState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-spotify-green border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-spotify-muted">Loading your mix…</p>
        </div>
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md text-center space-y-4">
          <p className="text-2xl">⚠️</p>
          <p className="text-white font-semibold">Failed to load</p>
          <p className="text-spotify-muted text-sm">{errorMsg}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Start over
          </button>
        </div>
      </div>
    )
  }

  const currentSong = songs[currentSongIndex] ?? null
  const sdkReady = !!deviceId

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h1 className="text-lg font-bold">
          Shuffler<span className="text-spotify-green">ion</span>
        </h1>
        <span className="text-xs text-spotify-muted font-mono">{sessionId}</span>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
        {/* Left: now playing + controls */}
        <div className="flex flex-col items-center gap-6 lg:w-80 shrink-0">
          <NowPlaying song={currentSong} isPlaying={isPlaying} />

          {!hasStarted && (
            <button
              onClick={handleStart}
              disabled={!sdkReady || songs.length === 0}
              className="btn-primary w-full"
            >
              {sdkReady ? 'Start Shufflerion' : 'Connecting to Spotify…'}
            </button>
          )}

          {hasStarted && (
            <>
              <PlayerControls
                isPlaying={isPlaying}
                onPrev={handlePrev}
                onTogglePlay={handleTogglePlay}
                onNext={handleNext}
              />
              {hostAccessToken && deviceId && (
                <VolumeControl accessToken={hostAccessToken} deviceId={deviceId} />
              )}
            </>
          )}

          {/* Partner info */}
          {session && (
            <div className="text-xs text-spotify-muted text-center space-y-0.5">
              <p>🎵 {session.host.email}</p>
              <p>🎵 {session.guest.email}</p>
            </div>
          )}
        </div>

        {/* Right: song list */}
        <div className="flex-1 overflow-hidden">
          <SongList songs={songs} currentIndex={currentSongIndex} hasStarted={hasStarted} />
        </div>
      </div>
    </div>
  )
}
