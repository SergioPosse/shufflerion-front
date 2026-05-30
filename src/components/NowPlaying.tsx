import type { Song } from '../types'

interface Props {
  song: Song | null
  isPlaying: boolean
}

export default function NowPlaying({ song, isPlaying }: Props) {
  return (
    <div className="w-full space-y-4">
      {/* Album art */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-spotify-surface">
        {song?.Image ? (
          <img
            src={song.Image}
            alt={`${song.Title} album art`}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isPlaying ? 'scale-105' : 'scale-100'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MusicNote />
          </div>
        )}

        {/* Playing glow */}
        {isPlaying && song && (
          <div className="absolute inset-0 ring-2 ring-spotify-green rounded-2xl animate-glow pointer-events-none" />
        )}
      </div>

      {/* Track info */}
      <div className="text-center">
        {song ? (
          <>
            <p className="font-bold text-lg text-white truncate">{song.Title}</p>
            <p className="text-spotify-muted text-sm truncate">{song.Artist}</p>
            {song.Explicit && (
              <span className="inline-block mt-1 text-xs bg-spotify-muted/20 text-spotify-muted px-1.5 py-0.5 rounded">
                E
              </span>
            )}
          </>
        ) : (
          <p className="text-spotify-muted">No song playing</p>
        )}
      </div>
    </div>
  )
}

function MusicNote() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-16 h-16 text-spotify-muted fill-current"
      aria-hidden
    >
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  )
}
