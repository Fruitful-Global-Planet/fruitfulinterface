import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-bark-800 text-cream-200 mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <img src="https://banimal.co.za/assets/logo-white-Cn9gtfrc.png" alt="Banimal" className="h-8 mb-4" />
            <p className="text-cream-400 text-sm leading-relaxed">
              Premium 100% cotton baby essentials, thoughtfully designed in South Africa and shipped worldwide.
            </p>
          </div>
          <div>
            <p className="label-tag mb-4">Shop</p>
            <ul className="space-y-2 text-sm text-cream-400">
              <li><Link to="/shop" className="hover:text-cream-200 transition-colors">Babygrows</Link></li>
              <li><Link to="/shop" className="hover:text-cream-200 transition-colors">Bibs</Link></li>
              <li><Link to="/shop" className="hover:text-cream-200 transition-colors">New Arrivals</Link></li>
            </ul>
          </div>
          <div>
            <p className="label-tag mb-4">Company</p>
            <ul className="space-y-2 text-sm text-cream-400">
              <li><Link to="/about" className="hover:text-cream-200 transition-colors">About</Link></li>
              <li><a href="mailto:hello@banimal.co.za" className="hover:text-cream-200 transition-colors">Contact</a></li>
              <li><a href="/returns-refund-policy" className="hover:text-cream-200 transition-colors">Returns &amp; Refund Policy</a></li>
              <li><a href="https://banimal.co.za" className="hover:text-cream-200 transition-colors">banimal.co.za</a></li>
            </ul>
          </div>
          <div>
            <p className="label-tag mb-4">Connect</p>
            <ul className="space-y-2 text-sm text-cream-400">
              <li><a href="https://instagram.com/banimalza" target="_blank" rel="noreferrer" className="hover:text-cream-200 transition-colors">Instagram</a></li>
              <li><a href="https://facebook.com/banimalza" target="_blank" rel="noreferrer" className="hover:text-cream-200 transition-colors">Facebook</a></li>
              <li><a href="https://tiktok.com/@banimalza" target="_blank" rel="noreferrer" className="hover:text-cream-200 transition-colors">TikTok</a></li>
              <li><a href="mailto:kindrefund@banimal.co.za" className="hover:text-cream-200 transition-colors">Returns &amp; refunds</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-bark-700 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-cream-400 text-xs">&copy; {new Date().getFullYear()} Banimal. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs text-cream-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span>15.01% of every sale supports children in need</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
