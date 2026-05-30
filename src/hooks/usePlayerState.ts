import { useState, useRef, useCallback, useEffect } from 'react'
import type { Song } from '../types'
import { activateDevice, playSong } from '../services/spotifyApi'

interface UsePlayerStateOptions {
  player: Spotify.Player | null
  deviceId: string | null
  accessToken: string | null
  songs: Song[]
  onSongsExhausted: () => Promise<Song[]>
}

export function usePlayerState({
  player,
  deviceId,
  accessToken,
  songs,
  onSongsExhausted,
}: UsePlayerStateOptions) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)

  // Refs that event listeners can read without stale closures
  const isPlayingRef = useRef(false)
  const currentSongIndexRef = useRef(0)
  const songsRef = useRef<Song[]>(songs)
  const prevTrackNameRef = useRef('')
  const endedRef = useRef(false)
  const accessTokenRef = useRef<string | null>(accessToken)
  const deviceIdRef = useRef<string | null>(deviceId)

  // Keep refs in sync with state/props
  useEffect(() => { songsRef.current = songs }, [songs])
  useEffect(() => { accessTokenRef.current = accessToken }, [accessToken])
  useEffect(() => { deviceIdRef.current = deviceId }, [deviceId])

  const startSong = useCallback(async (index: number) => {
    const token = accessTokenRef.current
    const device = deviceIdRef.current
    const song = songsRef.current[index]
    if (!token || !device || !song) return

    await activateDevice(token, device)
    const ok = await playSong(token, device, song.Url)
    if (ok) {
      prevTrackNameRef.current = song.Title
      endedRef.current = false
      setCurrentSongIndex(index)
      currentSongIndexRef.current = index
    }
  }, [])

  const handleNext = useCallback(async () => {
    const nextIndex = currentSongIndexRef.current + 1

    if (nextIndex >= songsRef.current.length) {
      // Fetch a new batch and continue from the first new song
      const newSongs = await onSongsExhausted()
      if (newSongs.length === 0) return
      songsRef.current = newSongs
      currentSongIndexRef.current = 0
      setCurrentSongIndex(0)
      await startSong(0)
      return
    }

    await startSong(nextIndex)
  }, [startSong, onSongsExhausted])

  const handlePrev = useCallback(async () => {
    const prevIndex = Math.max(0, currentSongIndexRef.current - 1)
    await startSong(prevIndex)
  }, [startSong])

  const handleStart = useCallback(async () => {
    if (!player) return
    if (!hasStarted) {
      setHasStarted(true)
      setIsPlaying(true)
      isPlayingRef.current = true
      await startSong(0)
    } else {
      await player.togglePlay()
    }
  }, [player, hasStarted, startSong])

  const handleTogglePlay = useCallback(async () => {
    if (!player) return
    await player.togglePlay()
  }, [player])

  // Register the song-end detection listener whenever the player is ready
  useEffect(() => {
    if (!player) return

    const onStateChange = async (state: Spotify.PlaybackState | null) => {
      if (!state) return

      const { paused, position, track_window } = state
      const currentName = track_window.current_track.name

      // Capture the "was playing" state BEFORE updating it
      const wasPlaying = isPlayingRef.current

      // Sync isPlaying with Spotify's actual state (handles external pauses too)
      setIsPlaying(!paused)
      isPlayingRef.current = !paused

      // --- Song-end detection ---
      // We need two independent signals so we don't false-positive on manual pause
      // or on the brief position=0 moment when a new track starts loading.
      //
      // Original approach (preserved): same track name + paused + wasPlaying.
      //   Handles edge cases where Spotify's position doesn't reset cleanly.
      //   "wasPlaying" guards against detecting paused→paused transitions.
      //
      // Enhanced approach: position === 0 + paused + same track name.
      //   More precise: position resets to 0 only when a song ends naturally.
      //   A manual pause keeps position > 0. A new track would have a different name.
      //
      // Both checks combined give maximum reliability against the SDK's quirks.
      if (
        !endedRef.current &&
        wasPlaying && // was playing before this event (guards pause→pause)
        paused &&
        position === 0 && // position reset → natural end, not manual pause
        currentName === prevTrackNameRef.current && // same track, not a new one loading
        prevTrackNameRef.current !== '' // guard against initial state
      ) {
        endedRef.current = true
        await handleNext()
      }
    }

    player.addListener('player_state_changed', onStateChange)
    return () => {
      player.removeListener('player_state_changed', onStateChange)
    }
  }, [player, handleNext])

  return {
    isPlaying,
    currentSongIndex,
    hasStarted,
    handleStart,
    handleNext,
    handlePrev,
    handleTogglePlay,
  }
}
