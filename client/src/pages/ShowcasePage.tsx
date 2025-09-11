import React from 'react';
import Cards from '@/components/ui/cards';
import { Star, TrendingUp, Clock, Users } from 'lucide-react';

const ShowcasePage = () => {
  return (
    <div className='text-white'>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* Character Showcase using Cards component */}
        <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-orange-500/10 overflow-hidden">
          <h2 className="text-2xl font-bold text-zinc-200 mb-6">Featured Characters</h2>
          <div className="w-full overflow-hidden">
            <Cards />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowcasePage; 