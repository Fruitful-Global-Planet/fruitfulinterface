import { useEffect } from 'react'
import { X, Sparkles, ShoppingBag } from 'lucide-react'
import type { Product } from './ProductCard'

interface Props {
  open: boolean
  items: Product[]
  catalog: Product[]
  lastAdded?: Product | null
  onAdd: (product: Product) => void
  onClose: () => void
}

function track(name: string, payload: Record<string, string | number | boolean | undefined>) {
  try {
    const va = (window as unknown as { va?: (event: string, name: string, data?: Record<string, unknown>) => void }).va
    va?.('event', name, payload)
  } catch {}
}

function formatZar(value: number) {
  return `R ${Math.round(value)}`
}

export default function BasketBoost({ open, items, catalog, lastAdded, onAdd, onClose }: Props) {
  const cartIds = new Set(items.map((item) => item.id))
  const base = lastAdded || items[items.length - 1]
  const recommendations = catalog
    .filter((product) => !cartIds.has(product.id))
    .sort((a, b) => {
      if (!base) return 0
      const aMatch = a.category === base.category ? 1 : 0
      const bMatch = b.category === base.category ? 1 : 0
      return aMatch - bMatch
    })
    .slice(0, 3)

  const subtotal = items.reduce((sum, item) => sum + item.price, 0)
  const bundleUnlocked = items.length >= 2
  const saving = bundleUnlocked ? subtotal * 0.1 : 0
  const total = subtotal - saving
  const needed = Math.max(0, 2 - items.length)

  useEffect(() => {
    if (!open) return
    track('basket_boost_view', {
      cartCount: items.length,
      lastProductId: base?.id,
      discountPercent: 10,
    })
  }, [base?.id, items.length, open])

  const addBoostItem = (product: Product) => {
    onAdd(product)
    track('basket_boost_accept', {
      productId: product.id,
      productName: product.name,
      cartCount: items.length + 1,
      discountPercent: 10,
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-bark-900/30 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Basket boost">
      <aside className="h-full w-full max-w-md overflow-y-auto bg-cream-100 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cream-300 bg-cream-100/95 px-5 py-4 backdrop-blur-sm">
          <div>
            <p className="label-tag mb-1">Basket boost</p>
            <h2 className="font-serif text-2xl text-bark-800">Complete the set</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-cream-200" aria-label="Close basket boost">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-2xl bg-bark-800 p-5 text-cream-100">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-rose-200" />
              <p className="text-sm font-medium">Add one more tiny-human essential and unlock 10%.</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-cream-100/20">
              <div className="h-full rounded-full bg-rose-200 transition-all" style={{ width: `${Math.min(items.length, 2) * 50}%` }} />
            </div>
            <p className="mt-2 text-xs text-cream-100/70">
              {bundleUnlocked ? 'Bundle saving unlocked.' : `${needed} more item${needed === 1 ? '' : 's'} to unlock bundle saving.`}
            </p>
          </div>

          <div className="rounded-2xl border border-cream-300 bg-white/50 p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-bark-700/70">Subtotal</span>
              <span className="font-mono text-bark-800">{formatZar(subtotal)}</span>
            </div>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-sage-dark">Bundle saving</span>
              <span className="font-mono text-sage-dark">-{formatZar(saving)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-cream-300 pt-3">
              <span className="font-serif text-lg text-bark-800">Boosted total</span>
              <span className="font-mono text-bark-800">{formatZar(total)}</span>
            </div>
          </div>

          {recommendations.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-medium text-bark-800">Most parents add this</p>
              <div className="space-y-3">
                {recommendations.map((product) => (
                  <div key={product.id} className="flex gap-3 rounded-2xl border border-cream-300 bg-cream-50 p-3">
                    <img src={product.image} alt={product.name} className="h-20 w-20 rounded-xl object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="label-tag mb-1">{product.category}</p>
                      <p className="text-sm font-medium text-bark-800">{product.name}</p>
                      <p className="mt-1 font-mono text-xs text-bark-700/70">{formatZar(product.price)}</p>
                      <button onClick={() => addBoostItem(product)} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-bark-800 px-3 py-2 text-xs font-medium text-cream-100 hover:bg-bark-700">
                        <ShoppingBag className="h-3.5 w-3.5" /> Add & save 10%
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <a
            href={`https://banimal.co.za/checkout?source=basket_boost&discount=10&total=${Math.round(total)}`}
            onClick={() => track('basket_boost_checkout', { cartCount: items.length, boostedTotal: Math.round(total), saving: Math.round(saving) })}
            className="btn-primary w-full justify-center rounded-xl"
          >
            Continue to secure checkout
          </a>
          <p className="text-center text-xs leading-relaxed text-bark-700/50">
            Discount preview is shown in-basket; payment still runs through the proven Paystack checkout.
          </p>
        </div>
      </aside>
    </div>
  )
}
