import { useState, useRef, useCallback, useEffect } from 'react'
import type { Song } from '../types'
import { activateDevice, playSong } from '../services/spotifyApi'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 800
const MAX_CONSECUTIVE_FAILURES = 5 // stop skipping if too many songs fail in a row

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

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
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set())

  const isPlayingRef = useRef(false)
  const currentSongIndexRef = useRef(0)
  const songsRef = useRef<Song[]>(songs)
  const prevTrackNameRef = useRef('')
  const endedRef = useRef(false)
  const accessTokenRef = useRef<string | null>(accessToken)
  const deviceIdRef = useRef<string | null>(deviceId)

  useEffect(() => { songsRef.current = songs }, [songs])
  useEffect(() => { accessTokenRef.current = accessToken }, [accessToken])
  useEffect(() => { deviceIdRef.current = deviceId }, [deviceId])

  // Tries to play a song with up to MAX_RETRIES attempts.
  // Returns true on success, false if all attempts fail.
  const startSong = useCallback(async (index: number): Promise<boolean> => {
    const token = accessTokenRef.current
    const device = deviceIdRef.current
    const song = songsRef.current[index]
    if (!token || !device || !song) return false

    let ok = false
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      await activateDevice(token, device)
      ok = await playSong(token, device, song.Url)
      if (ok) break
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS)
    }

    if (ok) {
      prevTrackNameRef.current = song.Title
      endedRef.current = false
      setCurrentSongIndex(index)
      currentSongIndexRef.current = index
    } else {
      setFailedIndices((prev) => new Set([...prev, index]))
    }

    return ok
  }, [])

  const handleNext = useCallback(async () => {
    // Block the SDK listener immediately — when we skip, Spotify fires
    // player_state_changed (paused + position=0) for the interrupted song, which
    // looks identical to a natural song end and would cause a double-trigger + 403.
    endedRef.current = true

    let nextIndex = currentSongIndexRef.current + 1
    let failures = 0

    while (failures < MAX_CONSECUTIVE_FAILURES) {
      if (nextIndex >= songsRef.current.length) {
        // Ran out of songs — fetch a new batch
        const newSongs = await onSongsExhausted()
        if (newSongs.length === 0) return
        songsRef.current = newSongs
        setFailedIndices(new Set())
        nextIndex = 0
      }

      const ok = await startSong(nextIndex)
      if (ok) return

      // Song failed — skip it and try the next one
      failures++
      nextIndex++
    }
  }, [startSong, onSongsExhausted])

  const handlePrev = useCallback(async () => {
    endedRef.current = true // same guard as handleNext
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

  useEffect(() => {
    if (!player) return

    const onStateChange = async (state: Spotify.PlaybackState | null) => {
      if (!state) return

      const { paused, position, track_window } = state
      const currentName = track_window.current_track.name

      const wasPlaying = isPlayingRef.current

      setIsPlaying(!paused)
      isPlayingRef.current = !paused

      // --- Song-end detection ---
      // Original approach (preserved): same track name + paused + wasPlaying.
      // Enhanced approach: position === 0 confirms natural end vs manual pause.
      // Both combined give maximum reliability against the SDK's quirks.
      if (
        !endedRef.current &&
        wasPlaying &&
        paused &&
        position === 0 &&
        currentName === prevTrackNameRef.current &&
        prevTrackNameRef.current !== ''
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
    failedIndices,
    handleStart,
    handleNext,
    handlePrev,
    handleTogglePlay,
  }
}
