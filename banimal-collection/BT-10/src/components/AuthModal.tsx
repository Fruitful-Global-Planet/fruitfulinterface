import { useEffect, useRef, useState, type ReactElement } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Real OAuth redirects for every provider — a click sends the browser to
// /auth/{id}/start on the Worker, which does the actual Authorization Code
// (+ PKCE where supported) round trip. Nothing here fabricates a user.
const PROVIDERS: { id: string; label: string; icon: ReactElement }[] = [
  {
    id: 'google',
    label: 'Continue with Google',
    icon: (
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
        <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z" />
        <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z" />
      </svg>
    ),
  },
  {
    id: 'apple',
    label: 'Continue with Apple',
    icon: (
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
        <path fill="currentColor" d="M16.36 1c.12 1.06-.3 2.1-.94 2.87-.66.79-1.75 1.4-2.8 1.32-.15-1.03.34-2.1 1-2.83C14.29 1.53 15.4 1 16.36 1Zm3.4 16.6c-.5 1.13-.74 1.63-1.38 2.63-.9 1.4-2.16 3.14-3.73 3.16-1.39.02-1.75-.9-3.64-.89-1.88.01-2.28.9-3.68.89-1.57-.02-2.77-1.6-3.67-3-2.52-3.9-2.78-8.48-1.23-10.92 1.1-1.75 2.83-2.77 4.45-2.77 1.65 0 2.69.9 4.06.9 1.32 0 2.13-.9 4.05-.9 1.44 0 2.97.79 4.06 2.14-3.57 1.96-2.99 7.06.71 8.76Z" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Continue with Facebook',
    icon: (
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
        <path fill="#1877F2" d="M24 12.07C24 5.69 18.63.5 12 .5S0 5.69 0 12.07C0 17.83 4.39 22.6 10.13 23.5v-8.09H7.08v-3.34h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.94-1.95 1.9v2.24h3.32l-.53 3.34h-2.79V23.5C19.61 22.6 24 17.83 24 12.07Z" />
      </svg>
    ),
  },
  {
    id: 'github',
    label: 'Continue with GitHub',
    icon: (
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
        <path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.7 5.38-5.27 5.67.42.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .3.21.66.79.55A10.51 10.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
      </svg>
    ),
  },
  {
    id: 'microsoft',
    label: 'Continue with Microsoft',
    icon: (
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
        <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
        <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
        <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
        <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
      </svg>
    ),
  },
  {
    id: 'twitter',
    label: 'Continue with X',
    icon: (
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
        <path fill="currentColor" d="M18.24 2H21l-6.55 7.49L22.2 22h-6.19l-4.85-6.34L5.6 22H2.83l7.01-8.01L1.8 2h6.34l4.38 5.79L18.24 2Zm-1.08 18.17h1.72L7.03 3.73H5.18l11.98 16.44Z" />
      </svg>
    ),
  },
]

interface Props {
  onClose: () => void
}

export default function AuthModal({ onClose }: Props) {
  const { setUser, showToast } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleOAuth = (providerId: string) => {
    // A real full-page navigation, not a fetch — the provider needs to see
    // the user's own browser to show its consent screen.
    window.location.href = `/auth/${providerId}/start`
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const endpoint = mode === 'signup' ? '/auth/email/signup' : '/auth/email/signin'
      const body = mode === 'signup' ? { name, email, password } : { email, password }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      setUser(data.user)
      showToast(`Welcome, ${data.user.name}!`)
      onClose()
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to Banimal"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="absolute inset-0 bg-bark-900/40 backdrop-blur-sm" />
      <div ref={dialogRef} className="relative bg-cream-50 w-full max-w-sm rounded-2xl shadow-2xl p-8 animate-slide-up max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-cream-200 transition-colors" aria-label="Close">
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <img src="https://banimal.co.za/assets/logo-oV1EcZZO.png" alt="Banimal" className="h-7 mx-auto mb-4" />
          <h2 className="text-xl font-serif font-semibold text-bark-800">Sign in to Banimal</h2>
          <p className="text-sm text-bark-700/60 mt-1">Save your order history and get a faster checkout.</p>
        </div>

        <div className="space-y-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleOAuth(p.id)}
              className="w-full flex items-center gap-3 px-4 py-3 border border-cream-300 rounded-xl text-sm text-bark-800 font-medium transition-colors hover:bg-cream-100"
            >
              {p.icon}
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-cream-300" />
          <span className="text-xs text-bark-700/50 uppercase tracking-wide">or continue with email</span>
          <div className="flex-1 h-px bg-cream-300" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              required
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-bark-800/20"
            />
          )}
          <input
            type="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-bark-800/20"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-bark-800/20"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full justify-center rounded-xl text-sm disabled:opacity-60">
            {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-bark-700/70 mt-4">
          {mode === 'signup' ? (
            <>Already have an account?{' '}
              <button className="text-bark-800 font-medium underline" onClick={() => { setMode('signin'); setError(null) }}>Sign in</button>
            </>
          ) : (
            <>New to Banimal?{' '}
              <button className="text-bark-800 font-medium underline" onClick={() => { setMode('signup'); setError(null) }}>Create an account</button>
            </>
          )}
        </p>

        <button onClick={onClose} className="block w-full text-center text-sm text-bark-700/60 underline mt-4">
          Continue as guest
        </button>

        <p className="text-xs text-center text-bark-700/40 mt-6">
          By continuing you agree to our Terms &amp; Privacy Policy
        </p>
      </div>
    </div>
  )
}
