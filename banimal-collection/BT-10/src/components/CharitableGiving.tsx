import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'

interface Props {
  orderTotalZAR: number
  taxRate?: number
}

const GIVING_RATE = 0.1501

const TIERS: Array<{ minVal: number; item: string; description: string }> = [
  { minVal: 0, item: 'a bandana bib', description: 'soft cotton bib for a baby in need' },
  { minVal: 300, item: 'a babygrow', description: '100% cotton babygrow donated to a child' },
  { minVal: 600, item: 'a babygrow set', description: 'full babygrow set (0–9 months) donated' },
  { minVal: 1200, item: 'a complete layette', description: 'babygrows, bibs & clothing essentials' },
]

export default function CharitableGiving({ orderTotalZAR, taxRate = 0.15 }: Props) {
  const preTax = orderTotalZAR / (1 + taxRate)
  const givingAmount = Math.round(preTax * GIVING_RATE * 100) / 100
  const tier = [...TIERS].reverse().find((t) => givingAmount >= t.minVal * GIVING_RATE) || TIERS[0]

  const [totalRaised, setTotalRaised] = useState<number | null>(null)
  useEffect(() => {
    fetch('/api/giving/stats')
      .then((r) => r.json())
      .then((d: { totalZAR: number }) => setTotalRaised(d.totalZAR))
      .catch(() => {})
  }, [])

  return (
    <div className="flex items-start gap-3 p-4 bg-cream-50 rounded-2xl border border-cream-300">
      <div className="p-2 bg-rose-50 rounded-xl flex-shrink-0">
        <Heart className="w-4 h-4 text-rose-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-bark-800">
          R {givingAmount.toFixed(2)} funds <span className="italic">{tier.item}</span>
        </p>
        <p className="text-xs text-bark-700/60 mt-0.5">
          15.01% of your pre-tax order — {tier.description}
        </p>
        {totalRaised !== null && totalRaised > 0 && (
          <p className="text-xs text-bark-700/50 mt-1">R{totalRaised.toFixed(2)} raised in total so far</p>
        )}
      </div>
    </div>
  )
}
