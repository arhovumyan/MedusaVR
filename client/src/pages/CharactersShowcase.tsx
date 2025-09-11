import React from 'react'
import { Star, TrendingUp, Clock, Users } from 'lucide-react'

const CharactersShowcase = () => {
  return (
    <div className='text-white'>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-4">
            Character Showcase
          </h1>
          <p className="text-zinc-300 mb-6">
            Featured characters and trending personalities
          </p>
        </div>

        {/* Categories - Mobile: Horizontal scroll, Desktop: Grid */}
        <div className="mb-8">
          {/* Mobile: Horizontal scrolling layout */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide mobile-horizontal-scroll pb-2 md:hidden">
            {[
              { icon: TrendingUp, title: "Trending", desc: "Most popular this week", color: "text-red-400" },
              { icon: Star, title: "Featured", desc: "Handpicked by our team", color: "text-yellow-400" },
              { icon: Clock, title: "New", desc: "Recently added", color: "text-green-400" },
              { icon: Users, title: "Community", desc: "User favorites", color: "text-blue-400" }
            ].map((category, i) => (
              <div key={i} className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-lg p-3 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer group flex-shrink-0 w-32">
                <div className={`w-8 h-8 ${category.color.replace('text-', 'bg-').replace('-400', '-500/20')} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 mx-auto`}>
                  <category.icon className={`w-4 h-4 ${category.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-1 text-center">{category.title}</h3>
                <p className="text-zinc-400 text-xs text-center leading-tight">{category.desc}</p>
              </div>
            ))}
          </div>

          {/* Desktop: Grid layout (unchanged) */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: TrendingUp, title: "Trending", desc: "Most popular this week", color: "text-red-400" },
              { icon: Star, title: "Featured", desc: "Handpicked by our team", color: "text-yellow-400" },
              { icon: Clock, title: "New", desc: "Recently added", color: "text-green-400" },
              { icon: Users, title: "Community", desc: "User favorites", color: "text-blue-400" }
            ].map((category, i) => (
              <div key={i} className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-xl p-6 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer group">
                <div className={`w-12 h-12 ${category.color.replace('text-', 'bg-').replace('-400', '-500/20')} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <category.icon className={`w-6 h-6 ${category.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{category.title}</h3>
                <p className="text-zinc-400 text-sm">{category.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Showcase Grid */}
        <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-8 shadow-2xl shadow-orange-500/10">
          <h2 className="text-2xl font-bold text-zinc-200 mb-6">Featured Characters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-64">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-zinc-800/30 rounded-xl border border-orange-500/10 flex items-center justify-center hover:border-orange-500/30 transition-all duration-200">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-500/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Users className="w-8 h-8 text-orange-400" />
                  </div>
                  <p className="text-zinc-400 text-sm">Character #{i + 1}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-zinc-400">Character showcase coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CharactersShowcase