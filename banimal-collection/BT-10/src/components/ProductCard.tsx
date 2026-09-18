import { useRef, useState } from 'react'
import { ShoppingBag, Eye } from 'lucide-react'
import { useAnalytics } from '@/contexts/AnalyticsContext'

export interface Product {
  id: string
  name: string
  price: number
  image: string
  category: string
  sizes?: string[]
  isNew?: boolean
}

interface Props {
  product: Product
  onAdd: (p: Product) => void
  badge?: 'popular' | 'new' | 'unseen'
}

export default function ProductCard({ product, onAdd, badge }: Props) {
  const { trackView, trackHover } = useAnalytics()
  const hoverStart = useRef<number>(0)
  const [hovered, setHovered] = useState(false)

  const handleMouseEnter = () => {
    hoverStart.current = Date.now()
    setHovered(true)
    trackView(product.id)
  }

  const handleMouseLeave = () => {
    if (hoverStart.current) {
      trackHover(product.id, Date.now() - hoverStart.current)
      hoverStart.current = 0
    }
    setHovered(false)
  }

  const badgeLabel: Record<string, string> = {
    popular: 'Popular',
    new: 'New',
    unseen: 'Just for you',
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative bg-cream-50 rounded-2xl overflow-hidden card-hover"
    >
      {badge && (
        <span className="absolute top-3 left-3 z-10 label-tag bg-bark-800 text-cream-100 px-2 py-0.5 rounded-full">
          {badgeLabel[badge]}
        </span>
      )}

      <div className="aspect-square overflow-hidden bg-cream-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div className="p-4">
        <p className="label-tag mb-1">{product.category}</p>
        <h3 className="font-serif text-bark-800 font-medium">{product.name}</h3>
        <div className="flex items-center justify-between mt-3">
          <span className="text-bark-800 font-mono text-sm">R {product.price}</span>
          <button
            onClick={() => onAdd(product)}
            className="p-2 bg-bark-800 text-cream-100 rounded-xl hover:bg-bark-700 transition-colors"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hovered && (
        <div className="absolute inset-0 flex items-center justify-center bg-bark-800/10 transition-opacity">
          <Eye className="w-6 h-6 text-bark-800/40" />
        </div>
      )}
    </div>
  )
}
