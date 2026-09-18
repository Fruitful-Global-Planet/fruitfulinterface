import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BobGoDelivery from '@/components/BobGoDelivery'
import CharitableGiving from '@/components/CharitableGiving'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/AuthModal'

const ORDER_TOTAL = 578
const TAX_RATE = 0.15

export default function Checkout() {
  const { user, showAuthModal, openAuth, closeAuth } = useAuth()
  const [delivery, setDelivery] = useState<{ service: string; price: number } | null>(null)

  const subtotal = ORDER_TOTAL
  const deliveryFee = delivery?.price || 0
  const total = subtotal + deliveryFee

  return (
    <div className="min-h-screen">
      <Navbar />
      {showAuthModal && <AuthModal onClose={closeAuth} />}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <h1 className="font-serif text-3xl text-bark-800 mb-12">Checkout</h1>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Left: delivery + auth */}
          <div className="space-y-8">
            {!user && (
              <div className="p-6 bg-cream-50 rounded-2xl border border-cream-300">
                <h3 className="font-serif text-lg text-bark-800 mb-2">Sign in for faster checkout</h3>
                <p className="text-sm text-bark-700/60 mb-4">Save your details and track your orders.</p>
                <button onClick={openAuth} className="btn-primary rounded-xl text-sm">
                  Sign in
                </button>
              </div>
            )}

            {user && (
              <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 flex items-center gap-3">
                <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-medium text-bark-800">{user.name}</p>
                  <p className="text-xs text-bark-700/60">{user.email}</p>
                </div>
              </div>
            )}

            <BobGoDelivery orderValueZAR={ORDER_TOTAL} onSelect={setDelivery} />
          </div>

          {/* Right: order summary */}
          <div>
            <div className="bg-cream-50 rounded-2xl border border-cream-200 p-6 space-y-4">
              <h3 className="font-serif text-lg text-bark-800">Order summary</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-bark-700/80">Subtotal</span>
                  <span className="font-mono">R {subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-bark-700/80">Delivery</span>
                  <span className="font-mono">{deliveryFee > 0 ? `R ${deliveryFee}` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-bark-700/80">VAT (15%)</span>
                  <span className="font-mono">R {Math.round(total * TAX_RATE / (1 + TAX_RATE))}</span>
                </div>
              </div>

              <div className="border-t border-cream-300 pt-4 flex justify-between font-medium">
                <span className="font-serif text-bark-800">Total</span>
                <span className="font-mono text-bark-800">R {total}</span>
              </div>

              <CharitableGiving orderTotalZAR={total} />

              <div className="grid gap-3 rounded-2xl border border-cream-200 bg-white/40 p-4 text-sm">
                <div>
                  <p className="font-medium text-bark-800">Secure Paystack checkout</p>
                  <p className="text-xs leading-relaxed text-bark-700/60">Card, Apple Pay, and EFT options stay inside the proven Paystack flow.</p>
                </div>
                <div>
                  <p className="font-medium text-bark-800">Delivery-ready details</p>
                  <p className="text-xs leading-relaxed text-bark-700/60">Your selected delivery option and email stay connected for fulfilment follow-up.</p>
                </div>
                <div>
                  <p className="font-medium text-bark-800">Purpose built in</p>
                  <p className="text-xs leading-relaxed text-bark-700/60">15.01% of every order flows into Banimal's giving loop.</p>
                </div>
              </div>

              <a
                href={`https://banimal.co.za/checkout?source=faa&total=${total}&delivery=${delivery?.service || ''}`}
                className="btn-primary w-full justify-center rounded-xl mt-2 text-sm"
              >
                Pay securely with Paystack
              </a>

              <p className="text-xs text-center leading-relaxed text-bark-700/50 mt-2">
                No payment details are stored by Banimal. Keep your Paystack reference for support.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
