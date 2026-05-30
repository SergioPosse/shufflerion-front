import { useEffect, useRef } from 'react'
import type { Song } from '../types'

interface Props {
  songs: Song[]
  currentIndex: number
  hasStarted: boolean
  failedIndices: Set<number>
}

export default function SongList({ songs, currentIndex, hasStarted, failedIndices }: Props) {
  const currentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [currentIndex])

  if (!hasStarted || songs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-spotify-muted text-sm">Songs will appear here as they play</p>
      </div>
    )
  }

  const revealedSongs = songs.slice(0, currentIndex + 1)

  return (
    <div className="flex flex-col h-full">
      <p className="text-xs text-spotify-muted uppercase tracking-wider mb-3 px-1 shrink-0">
        Played — {revealedSongs.length} song{revealedSongs.length !== 1 ? 's' : ''}
      </p>

      <div className="overflow-y-auto flex-1 space-y-1 pr-1">
        {revealedSongs.map((song, i) => {
          const isCurrent = i === currentIndex
          const isFailed = failedIndices.has(i)

          return (
            <div
              key={`${song.Url}-${i}`}
              ref={isCurrent ? currentRef : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300
                ${isCurrent ? 'bg-spotify-green/15 ring-1 ring-spotify-green' : ''}
                ${isFailed ? 'bg-red-900/20 ring-1 ring-red-800/50 opacity-60' : ''}
                ${!isCurrent && !isFailed ? 'bg-white/5' : ''}
              `}
            >
              {/* Thumbnail */}
              <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-spotify-surface">
                {song.Image ? (
                  <img src={song.Image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-spotify-muted text-xs">♪</div>
                )}
                {isCurrent && !isFailed && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-spotify-green text-xs font-bold">▶</span>
                  </div>
                )}
                {isFailed && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-red-400 text-xs">✕</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isCurrent ? 'text-spotify-green' : isFailed ? 'text-red-400/70' : 'text-white/80'}`}>
                  {song.Title}
                </p>
                <p className="text-xs truncate text-spotify-muted">{song.Artist}</p>
                {isFailed && (
                  <p className="text-xs text-red-400/60 mt-0.5">Not available</p>
                )}
              </div>

              {/* Right side */}
              {!isFailed && (
                <div className="flex items-center gap-2 shrink-0">
                  {song.Explicit && (
                    <span className="text-xs bg-white/10 text-spotify-muted px-1.5 py-0.5 rounded">E</span>
                  )}
                  <span className="text-xs text-spotify-muted">{formatDuration(song.Duration)}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}
