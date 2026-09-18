import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

// Renders nothing — mounted once, globally, alongside the routes. The Worker
// finishes every OAuth flow by 302-redirecting the browser to /?auth=success
// (or /?auth=error&reason=...). This watches for that query string on
// whichever page it lands on, resolves it, and strips it from the URL so a
// refresh doesn't re-trigger the toast.
export default function AuthCallback() {
  const [params, setParams] = useSearchParams()
  const { refreshSession, showToast } = useAuth()

  useEffect(() => {
    const auth = params.get('auth')
    if (!auth) return

    if (auth === 'success') {
      refreshSession().then((user) => {
        showToast(user ? `Welcome, ${user.name}!` : 'Welcome!')
      })
    } else if (auth === 'error') {
      const reason = params.get('reason')
      const message =
        reason === 'denied'
          ? 'Sign-in was cancelled.'
          : reason === 'not_configured'
            ? 'That sign-in option isn’t available yet.'
            : 'Sign-in didn’t work. Please try again.'
      showToast(message)
    }

    const next = new URLSearchParams(params)
    next.delete('auth')
    next.delete('reason')
    next.delete('provider')
    setParams(next, { replace: true })
    // Only re-run when the query string itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  return null
}
