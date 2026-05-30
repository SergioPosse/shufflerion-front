import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadPendingAuth, clearPendingAuth, saveHostTokens, saveSessionId } from '../utils/storage'
import { exchangeCode, createSession, updateSession } from '../services/backendApi'

type Step = 'exchanging' | 'saving-session' | 'done' | 'error'

export default function Callback() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('exchanging')
  const [guestSuccess, setGuestSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const errorParam = params.get('error')

    if (errorParam) {
      setErrorMsg(`Spotify authorization denied: ${errorParam}`)
      setStep('error')
      return
    }

    if (!code) {
      setErrorMsg('No authorization code received from Spotify.')
      setStep('error')
      return
    }

    const pending = loadPendingAuth()
    if (!pending) {
      setErrorMsg('Session data lost. Please start again.')
      setStep('error')
      return
    }

    async function finish() {
      try {
        setStep('exchanging')
        const tokens = await exchangeCode(code!)

        setStep('saving-session')

        if (pending!.type === 'host') {
          // Host: create the session with host tokens, then wait for guest
          saveHostTokens(tokens)
          await createSession(pending!.sessionId, pending!.hostEmail, tokens)
          saveSessionId(pending!.sessionId)
          clearPendingAuth()
          navigate(`/waiting/${pending!.sessionId}`, { replace: true })

        } else {
          // Guest: update the existing session with guest tokens, then show success
          await updateSession(pending!.sessionId, pending!.guestEmail, tokens)
          clearPendingAuth()
          setGuestSuccess(true)
          setStep('done')
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
        setStep('error')
      }
    }

    finish()
  }, [navigate])

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center space-y-4">
          <p className="text-2xl">⚠️</p>
          <p className="text-white font-semibold">Something went wrong</p>
          <p className="text-spotify-muted text-sm">{errorMsg}</p>
          <a href="/" className="btn-primary inline-block">
            Start over
          </a>
        </div>
      </div>
    )
  }

  // Guest success screen
  if (guestSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center space-y-4">
          <p className="text-5xl">✅</p>
          <p className="text-white text-xl font-bold">¡Listo!</p>
          <p className="text-spotify-muted">
            Your account is connected. Wait for your partner to start the music.
          </p>
        </div>
      </div>
    )
  }

  const label =
    step === 'exchanging' ? 'Connecting to Spotify…' : 'Setting up session…'

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-spotify-green border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-spotify-muted">{label}</p>
      </div>
    </div>
  )
}
