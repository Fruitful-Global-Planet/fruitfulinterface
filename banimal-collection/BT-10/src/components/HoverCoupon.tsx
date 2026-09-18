import { useEffect, useRef, useState } from 'react'
import { X, Sparkles } from 'lucide-react'

const DWELL_MS = 8000
const COUPON_KEY = 'bam_coupon_shown'
const CODE = 'STAY10'

export default function HoverCoupon() {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shownRef = useRef(false)

  useEffect(() => {
    if (sessionStorage.getItem(COUPON_KEY)) return

    let enteredAt = 0

    const onEnter = () => {
      enteredAt = Date.now()
      timerRef.current = setTimeout(() => {
        if (!shownRef.current) {
          shownRef.current = true
          setVisible(true)
          sessionStorage.setItem(COUPON_KEY, '1')
        }
      }, DWELL_MS)
    }

    const onLeave = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      enteredAt = 0
    }

    document.addEventListener('mouseenter', onEnter)
    document.addEventListener('mouseleave', onLeave)
    return () => {
      document.removeEventListener('mouseenter', onEnter)
      document.removeEventListener('mouseleave', onLeave)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const copy = () => {
    navigator.clipboard.writeText(CODE).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Exclusive discount"
      className="fixed bottom-6 right-6 z-[150] w-72 bg-cream-50 border border-cream-300 rounded-2xl shadow-xl p-6 animate-slide-up"
    >
      <button
        onClick={() => setVisible(false)}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-cream-200 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5 text-bark-700" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-cream-500" />
        <span className="label-tag">Just for you</span>
      </div>

      <p className="font-serif text-lg text-bark-800 leading-snug mb-1">
        10% off your first order
      </p>
      <p className="text-xs text-bark-700/60 mb-4">
        Use at checkout — limited time
      </p>

      <button
        onClick={copy}
        className="w-full font-mono text-sm tracking-widest bg-bark-800 text-cream-100 py-2.5 rounded-xl hover:bg-bark-700 transition-colors"
      >
        {copied ? '✓ Copied' : CODE}
      </button>
    </div>
  )
}
