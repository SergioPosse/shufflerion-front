import { useEffect, useRef } from 'react'
import type { Song } from '../types'

interface Props {
  songs: Song[]
  currentIndex: number
  hasStarted: boolean
}

export default function SongList({ songs, currentIndex, hasStarted }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to current song
  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [currentIndex])

  if (songs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-spotify-muted">Loading songs…</p>
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className="h-full overflow-y-auto space-y-1 pr-1"
      aria-label="Song queue"
    >
      <p className="text-xs text-spotify-muted uppercase tracking-wider mb-3 px-2">
        Up next — {songs.length} songs
      </p>

      {songs.map((song, i) => {
        const isCurrent = hasStarted && i === currentIndex
        const isPast = hasStarted && i < currentIndex

        return (
          <div
            key={`${song.Url}-${i}`}
            ref={isCurrent ? currentRef : undefined}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150
              ${isCurrent ? 'bg-white/10 ring-1 ring-spotify-green' : 'hover:bg-white/5'}
              ${isPast ? 'opacity-40' : ''}
            `}
          >
            {/* Thumbnail */}
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-spotify-surface">
              {song.Image ? (
                <img src={song.Image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-spotify-muted text-xs">
                  ♪
                </div>
              )}
              {isCurrent && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-spotify-green text-xs">▶</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${
                  isCurrent ? 'text-white' : 'text-white/80'
                }`}
              >
                {song.Title}
              </p>
              <p className="text-xs text-spotify-muted truncate">{song.Artist}</p>
            </div>

            {/* Explicit badge */}
            {song.Explicit && (
              <span className="text-xs bg-white/10 text-spotify-muted px-1.5 py-0.5 rounded shrink-0">
                E
              </span>
            )}

            {/* Duration */}
            <span className="text-xs text-spotify-muted shrink-0">
              {formatDuration(song.Duration)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}
