import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Heart } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard, { type Product } from '@/components/ProductCard'
import CharitableGiving from '@/components/CharitableGiving'
import BasketBoost from '@/components/BasketBoost'
import { useAnalytics } from '@/contexts/AnalyticsContext'
import { useAuth } from '@/contexts/AuthContext'

const FEATURED: Product[] = [
  { id: 'BT001', name: 'Classic White Babygrow 0–3m', price: 289, image: 'https://banimal.co.za/assets/BT001-BYDvu1g2.png', category: 'Babygrow', sizes: ['0–3m'], isNew: false },
  { id: 'BT002', name: 'Soft Grey Babygrow 0–3m', price: 289, image: 'https://banimal.co.za/assets/BT002-CX4CjBt9.png', category: 'Babygrow', sizes: ['0–3m'] },
  { id: 'BT003', name: 'Beige Essential Babygrow', price: 289, image: 'https://banimal.co.za/assets/BT003-Ynr1ODEe.png', category: 'Babygrow', sizes: ['3–6m'] },
  { id: 'BR001', name: 'Bandana Bib — Oatmeal', price: 129, image: 'https://banimal.co.za/assets/BR001-B9Svc9IF.png', category: 'Bib', isNew: true },
]

export default function Home() {
  const [cart, setCart] = useState<Product[]>([])
  const [basketOpen, setBasketOpen] = useState(false)
  const [lastAdded, setLastAdded] = useState<Product | null>(null)
  const { getHotItems, getColdItems } = useAnalytics()
  const { openAuth, user } = useAuth()

  const addToCart = (p: Product) => {
    setCart((prev) => [...prev, p])
    setLastAdded(p)
    setBasketOpen(true)
  }

  const hotIds = getHotItems()
  const coldIds = getColdItems(FEATURED.map((p) => p.id))

  const getBadge = (id: string): 'popular' | 'new' | 'unseen' | undefined => {
    if (hotIds.includes(id)) return 'popular'
    if (coldIds.includes(id)) return 'unseen'
    return undefined
  }

  return (
    <div className="min-h-screen">
      <Navbar cartCount={cart.length} />
      <BasketBoost open={basketOpen} items={cart} catalog={FEATURED} lastAdded={lastAdded} onAdd={addToCart} onClose={() => setBasketOpen(false)} />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-14">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://banimal.co.za/assets/banner-04-BS7lCpQ8.png)' }}
        />
        <div className="absolute inset-0 bg-bark-900/30" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-xl">
            <p className="label-tag text-cream-200 mb-4">South African Baby Brand</p>
            <h1 className="font-serif text-5xl md:text-7xl text-cream-50 leading-none mb-6">
              Soft on skin,<br />kind to earth.
            </h1>
            <p className="text-cream-200 text-lg mb-8 leading-relaxed">
              Premium 100% cotton babygrows and bibs, thoughtfully made in South Africa. Shipped worldwide.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary bg-cream-100 text-bark-800 hover:bg-cream-200 rounded-xl">
                Shop now <ArrowRight className="w-4 h-4" />
              </Link>
              {!user && (
                <button onClick={openAuth} className="btn-secondary border-cream-200 text-cream-100 hover:bg-cream-100 hover:text-bark-800 rounded-xl">
                  Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Giving banner */}
      <section className="bg-bark-800 text-cream-100 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-3 text-sm">
          <Heart className="w-4 h-4 text-rose-300 flex-shrink-0" />
          <span>15.01% of every sale funds babygrows &amp; bibs for children in need</span>
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="label-tag mb-2">Shop</p>
            <h2 className="font-serif text-3xl md:text-4xl text-bark-800">Featured essentials</h2>
          </div>
          <Link to="/shop" className="hidden md:flex items-center gap-1 text-sm text-bark-700/60 hover:text-bark-800 transition-colors">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {FEATURED.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={addToCart} badge={getBadge(p.id)} />
          ))}
        </div>

        <CharitableGiving orderTotalZAR={FEATURED.reduce((s, p) => s + p.price, 0)} />
      </section>

      {/* Brand story */}
      <section className="bg-cream-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src="https://banimal.co.za/assets/proudly-fruitful-B4Ya-b-c.jpg"
              alt="Proudly Banimal"
              className="rounded-2xl w-full object-cover aspect-square"
              loading="lazy"
            />
          </div>
          <div>
            <p className="label-tag mb-3">Our story</p>
            <h2 className="font-serif text-3xl text-bark-800 mb-4">Made with love,<br />worn with pride.</h2>
            <p className="text-bark-700/80 leading-relaxed mb-6">
              Every Banimal piece is made from 100% GOTS-certified cotton, grown and milled without harmful chemicals.
              We believe the best things you put on your baby's skin start from the ground up.
            </p>
            <Link to="/about" className="btn-secondary rounded-xl">
              Our story <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
