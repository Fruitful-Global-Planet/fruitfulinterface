import { useAuth } from '@/contexts/AuthContext'

// One shared toast, driven by AuthContext's toast state — used by sign-in,
// sign-out, and the OAuth callback so there's a single place this renders
// instead of each flow inventing its own banner.
export default function Toast() {
  const { toast } = useAuth()
  if (!toast) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-bark-800 text-cream-100 text-sm font-medium px-5 py-3 rounded-full shadow-xl animate-fade-in"
    >
      {toast}
    </div>
  )
}
