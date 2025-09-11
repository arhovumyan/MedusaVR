import React from 'react'
import { UserPlus, Bell, Users } from 'lucide-react'

const FollowingPage = () => {
  return (
    <div className='text-white'>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-4">
            Following
          </h1>
          <p className="text-zinc-300">
            Stay connected with your favorite creators and characters
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { icon: Users, title: "Following", count: "0", desc: "Creators & Characters", color: "text-blue-400" },
            { icon: Bell, title: "Updates", count: "0", desc: "New notifications", color: "text-green-400" },
            { icon: UserPlus, title: "Suggestions", count: "12", desc: "Recommended follows", color: "text-orange-400" }
          ].map((stat, i) => (
            <div key={i} className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-xl p-6 shadow-lg shadow-orange-500/10">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.color.replace('text-', 'bg-').replace('-400', '-500/20')} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-zinc-200">{stat.count}</h3>
                  <p className="text-sm text-zinc-400">{stat.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-12 text-center shadow-2xl shadow-orange-500/10">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-500/20 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-200 mb-2">No one to follow yet</h3>
          <p className="text-zinc-400 mb-6">
            Discover amazing creators and characters to follow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg transition-all duration-200 transform hover:scale-105">
              Explore Creators
            </button>
            <button className="px-6 py-3 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg transition-all duration-200">
              Browse Characters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FollowingPage