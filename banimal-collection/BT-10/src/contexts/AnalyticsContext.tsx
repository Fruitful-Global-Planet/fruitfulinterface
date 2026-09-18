import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface ViewRecord {
  productId: string
  views: number
  lastSeen: number
  hoverMs: number
}

interface AnalyticsCtx {
  trackView: (productId: string) => void
  trackHover: (productId: string, ms: number) => void
  getHotItems: () => string[]
  getColdItems: (allIds: string[]) => string[]
  scrollDepth: number
  hoverDwellMap: Record<string, number>
}

const Ctx = createContext<AnalyticsCtx | null>(null)

const STORE_KEY = 'bam_analytics'

function load(): Record<string, ViewRecord> {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
  } catch {
    return {}
  }
}

function save(data: Record<string, ViewRecord>) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data))
  } catch {}
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const records = useRef<Record<string, ViewRecord>>(load())
  const [scrollDepth, setScrollDepth] = useState(0)
  const [hoverDwellMap, setHoverDwellMap] = useState<Record<string, number>>({})

  useEffect(() => {
    const handleScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight
      if (docH > 0) setScrollDepth(Math.round((window.scrollY / docH) * 100))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const trackView = (productId: string) => {
    const r = records.current
    if (!r[productId]) {
      r[productId] = { productId, views: 0, lastSeen: 0, hoverMs: 0 }
    }
    r[productId].views += 1
    r[productId].lastSeen = Date.now()
    save(r)
  }

  const trackHover = (productId: string, ms: number) => {
    const r = records.current
    if (!r[productId]) {
      r[productId] = { productId, views: 0, lastSeen: Date.now(), hoverMs: 0 }
    }
    r[productId].hoverMs += ms
    save(r)
    setHoverDwellMap((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + ms }))
  }

  const getHotItems = () =>
    Object.values(records.current)
      .sort((a, b) => b.views - a.views)
      .slice(0, 4)
      .map((r) => r.productId)

  const getColdItems = (allIds: string[]) => {
    const seen = new Set(Object.keys(records.current))
    const unseen = allIds.filter((id) => !seen.has(id))
    return unseen.slice(0, 4)
  }

  return (
    <Ctx.Provider value={{ trackView, trackHover, getHotItems, getColdItems, scrollDepth, hoverDwellMap }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAnalytics() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAnalytics must be inside AnalyticsProvider')
  return ctx
}
