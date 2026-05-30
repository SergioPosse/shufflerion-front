import { useEffect } from 'react'
import { config } from '../config'

const PING_INTERVAL = 4 * 60 * 1000 // 4 minutes — Render sleeps after 15 min inactivity

export function useKeepAlive() {
  useEffect(() => {
    async function ping() {
      try {
        await fetch(`${config.backendUrl}/health`)
      } catch {
        // silent — if the server is down we'll notice on the next real request
      }
    }

    ping() // ping immediately on mount
    const interval = setInterval(ping, PING_INTERVAL)
    return () => clearInterval(interval)
  }, [])
}
