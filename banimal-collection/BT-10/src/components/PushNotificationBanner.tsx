import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'

const DISMISSED_KEY = 'bam_push_dismissed'
const API_BASE = 'https://banimal.co.za'

export default function PushNotificationBanner() {
  const [show, setShow] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        'Notification' in window &&
        'serviceWorker' in navigator &&
        Notification.permission === 'default' &&
        !sessionStorage.getItem(DISMISSED_KEY)
      ) {
        setShow(true)
      }
    }, 12000)
    return () => clearTimeout(timer)
  }, [])

  const subscribe = async () => {
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setShow(false); return }

      const reg = await navigator.serviceWorker.ready
      const keyResp = await fetch(`${API_BASE}/api/notifications/vapid-public-key`)
      const { publicKey } = await keyResp.json() as { publicKey: string }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(publicKey),
      })

      await fetch(`${API_BASE}/api/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
    } catch {
      // silent — not every browser supports all push features
    } finally {
      setSubscribing(false)
      setShow(false)
    }
  }

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed top-16 right-4 z-[100] w-80 bg-cream-50 border border-cream-200 rounded-2xl shadow-lg p-5 animate-slide-up">
      <button onClick={dismiss} className="absolute top-3 right-3 p-1 rounded-full hover:bg-cream-200 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-bark-800 rounded-xl">
          <Bell className="w-4 h-4 text-cream-100" />
        </div>
        <div>
          <p className="text-sm font-medium text-bark-800">Stay in the loop</p>
          <p className="text-xs text-bark-700/60">New drops &amp; restocks</p>
        </div>
      </div>
      <button
        onClick={subscribe}
        disabled={subscribing}
        className="w-full btn-primary text-sm justify-center rounded-xl py-2.5 mt-2"
      >
        {subscribing ? 'Subscribing…' : 'Allow notifications'}
      </button>
    </div>
  )
}

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}
