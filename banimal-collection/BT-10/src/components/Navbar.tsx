import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Menu, X, User, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from './AuthModal'

interface Props {
  cartCount?: number
}

export default function Navbar({ cartCount = 0 }: Props) {
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const { user, showAuthModal, openAuth, closeAuth, signOut } = useAuth()
  const navigate = useNavigate()
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 bg-cream-100/95 backdrop-blur-sm border-b border-cream-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2">
              <img src="https://banimal.co.za/assets/logo-oV1EcZZO.png" alt="Banimal" className="h-7" />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/shop" className="text-sm tracking-wide hover:text-cream-500 transition-colors">Shop</Link>
              <Link to="/about" className="text-sm tracking-wide hover:text-cream-500 transition-colors">About</Link>
              <a href="https://banimal.co.za/#giving" className="text-sm tracking-wide hover:text-cream-500 transition-colors">Giving</a>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => (user ? setAccountOpen((v) => !v) : openAuth())}
                  className="flex items-center gap-1 p-2 rounded-full hover:bg-cream-200 transition-colors"
                  aria-label="Account"
                  aria-expanded={user ? accountOpen : undefined}
                >
                  {user ? (
                    user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-bark-800 text-cream-100 text-[11px] font-medium flex items-center justify-center">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  {user && <ChevronDown className="w-3.5 h-3.5 text-bark-700/60" />}
                </button>

                {user && accountOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-cream-200 shadow-xl overflow-hidden py-1">
                    <div className="px-4 py-3 border-b border-cream-100">
                      <p className="text-sm font-medium text-bark-800 truncate">{user.name}</p>
                      {user.email && <p className="text-xs text-bark-700/60 truncate">{user.email}</p>}
                    </div>
                    <button
                      disabled
                      title="Coming soon"
                      className="w-full text-left px-4 py-2 text-sm text-bark-700/40 cursor-not-allowed"
                    >
                      My Orders
                    </button>
                    <button
                      disabled
                      title="Coming soon"
                      className="w-full text-left px-4 py-2 text-sm text-bark-700/40 cursor-not-allowed"
                    >
                      Wishlist
                    </button>
                    <button
                      onClick={() => { setAccountOpen(false); signOut() }}
                      className="w-full text-left px-4 py-2 text-sm text-bark-800 hover:bg-cream-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="relative p-2 rounded-full hover:bg-cream-200 transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-bark-800 text-cream-100 text-xs rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {open && (
          <div className="md:hidden bg-cream-100 border-t border-cream-200 px-4 py-4 space-y-3">
            <Link to="/shop" className="block text-sm tracking-wide py-2" onClick={() => setOpen(false)}>Shop</Link>
            <Link to="/about" className="block text-sm tracking-wide py-2" onClick={() => setOpen(false)}>About</Link>
            <a href="https://banimal.co.za/#giving" className="block text-sm tracking-wide py-2" onClick={() => setOpen(false)}>Giving</a>
          </div>
        )}
      </nav>

      {showAuthModal && <AuthModal onClose={closeAuth} />}
    </>
  )
}
