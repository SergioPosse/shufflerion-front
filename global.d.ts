declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void
    Spotify: typeof Spotify
  }
}

declare namespace Spotify {
  interface Player {
    connect(): Promise<boolean>
    disconnect(): void
    addListener(event: 'ready', cb: (data: { device_id: string }) => void): void
    addListener(event: 'not_ready', cb: (data: { device_id: string }) => void): void
    addListener(event: 'player_state_changed', cb: (state: PlaybackState | null) => void): void
    addListener(event: 'initialization_error', cb: (data: { message: string }) => void): void
    addListener(event: 'authentication_error', cb: (data: { message: string }) => void): void
    addListener(event: 'account_error', cb: (data: { message: string }) => void): void
    removeListener(event: string, cb?: (...args: unknown[]) => void): void
    togglePlay(): Promise<void>
    setVolume(volume: number): Promise<void>
    getCurrentState(): Promise<PlaybackState | null>
  }

  interface PlayerConstructorOptions {
    name: string
    getOAuthToken: (cb: (token: string) => void) => void
    volume?: number
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Player: new (options: PlayerConstructorOptions) => Player

  interface PlaybackState {
    context: { uri: string; metadata: unknown }
    disallows: { [key: string]: boolean }
    paused: boolean
    position: number
    duration: number
    repeat_mode: number
    shuffle: boolean
    track_window: TrackWindow
    timestamp: number
  }

  interface TrackWindow {
    current_track: Track
    previous_tracks: Track[]
    next_tracks: Track[]
  }

  interface Track {
    id: string
    uri: string
    name: string
    duration_ms: number
    album: { uri: string; name: string; images: { url: string }[] }
    artists: { uri: string; name: string }[]
  }
}
