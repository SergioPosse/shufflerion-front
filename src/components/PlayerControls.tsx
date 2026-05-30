interface Props {
  isPlaying: boolean
  onPrev: () => void
  onTogglePlay: () => void
  onNext: () => void
}

export default function PlayerControls({ isPlaying, onPrev, onTogglePlay, onNext }: Props) {
  return (
    <div className="flex items-center justify-center gap-8">
      <button
        onClick={onPrev}
        className="btn-icon"
        aria-label="Previous"
        title="Previous"
      >
        <PrevIcon />
      </button>

      <button
        onClick={onTogglePlay}
        className="w-14 h-14 rounded-full bg-white hover:bg-white/90 active:scale-95
                   transition-all duration-150 flex items-center justify-center"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <PauseIcon className="w-6 h-6 text-black fill-current" />
        ) : (
          <PlayIcon className="w-6 h-6 text-black fill-current translate-x-0.5" />
        )}
      </button>

      <button
        onClick={onNext}
        className="btn-icon"
        aria-label="Next"
        title="Next"
      >
        <NextIcon />
      </button>
    </div>
  )
}

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" aria-hidden>
      <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
    </svg>
  )
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" aria-hidden>
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}
