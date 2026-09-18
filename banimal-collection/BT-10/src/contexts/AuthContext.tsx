import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  provider: string
}

interface AuthCtx {
  user: User | null
  sessionLoading: boolean
  showAuthModal: boolean
  openAuth: () => void
  closeAuth: () => void
  signOut: () => void
  setUser: (u: User | null) => void
  refreshSession: () => Promise<User | null>
  toast: string | null
  showToast: (message: string) => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openAuth = () => setShowAuthModal(true)
  const closeAuth = () => setShowAuthModal(false)

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  // The session lives server-side behind an HttpOnly cookie, never in
  // localStorage — this is the one place the client learns who's signed in.
  const refreshSession = async (): Promise<User | null> => {
    try {
      const res = await fetch('/auth/session', { credentials: 'include' })
      const data = await res.json()
      const fetched: User | null = data.user || null
      setUser(fetched)
      return fetched
    } catch {
      // Network hiccup or the Worker route not reachable yet — stay signed
      // out rather than pretend, guest browsing works either way.
      setUser(null)
      return null
    } finally {
      setSessionLoading(false)
    }
  }

  useEffect(() => {
    refreshSession()
  }, [])

  const signOut = async () => {
    const previous = user
    setUser(null)
    try {
      await fetch('/auth/signout', { method: 'POST', credentials: 'include' })
    } catch {
      // Already cleared client-side state; a failed request here just means
      // the server-side session outlives this tab until it expires (30 days).
    }
    if (previous) showToast('Signed out.')
  }

  return (
    <Ctx.Provider value={{ user, sessionLoading, showAuthModal, openAuth, closeAuth, signOut, setUser, refreshSession, toast, showToast }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
