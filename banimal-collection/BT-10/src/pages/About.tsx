import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Heart, Leaf, Globe } from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <p className="label-tag mb-3">Our story</p>
        <h1 className="font-serif text-4xl md:text-5xl text-bark-800 mb-6">
          Made in South Africa,<br />worn with love.
        </h1>

        <img
          src="https://banimal.co.za/assets/proudly-fruitful-B4Ya-b-c.jpg"
          alt="Banimal brand story"
          className="w-full rounded-2xl mb-12 aspect-video object-cover"
        />

        <div className="prose prose-lg max-w-none text-bark-700 mb-16">
          <p>
            Banimal was born from a simple belief: what touches a baby's skin should be pure, gentle, and made with intention.
            Every babygrow and bib we make starts with 100% GOTS-certified organic cotton, grown without pesticides and treated
            with non-toxic dyes.
          </p>
          <p>
            We design in South Africa, manufacture responsibly, and ship worldwide — because great products shouldn't
            have borders.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: Leaf, title: '100% Organic Cotton', desc: 'GOTS-certified from seed to shelf.' },
            { icon: Heart, title: 'Giving 15.01%', desc: '15.01% of every pre-tax sale funds babygrows & bibs for children in need.' },
            { icon: Globe, title: 'Ships Worldwide', desc: 'BobGo-powered delivery to your door.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-cream-50 rounded-2xl p-6 border border-cream-200">
              <Icon className="w-6 h-6 text-bark-700 mb-3" />
              <h3 className="font-serif text-lg text-bark-800 mb-2">{title}</h3>
              <p className="text-sm text-bark-700/70 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-bark-800 text-cream-100 rounded-2xl p-8">
          <h2 className="font-serif text-2xl mb-4">Get in touch</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-cream-300">
            <div>
              <p className="label-tag text-cream-500 mb-1">General enquiries</p>
              <a href="mailto:hello@banimal.co.za" className="hover:text-cream-100 transition-colors">hello@banimal.co.za</a>
            </div>
            <div>
              <p className="label-tag text-cream-500 mb-1">Returns &amp; refunds</p>
              <a href="mailto:kindrefund@banimal.co.za" className="hover:text-cream-100 transition-colors">kindrefund@banimal.co.za</a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
