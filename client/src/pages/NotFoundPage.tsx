import React from 'react'
import { Link } from 'wouter'
import { Home, ArrowLeft, Search } from 'lucide-react'

const NotFoundPage = () => {
  return (
    <div className='text-white'>
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-12 shadow-2xl shadow-orange-500/10">
          {/* 404 Icon */}
          <div className="w-24 h-24 mx-auto mb-6 bg-orange-500/20 rounded-full flex items-center justify-center">
            <Search className="w-12 h-12 text-orange-400" />
          </div>
          
          {/* Error Message */}
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-zinc-200 mb-4">
            Page Not Found
          </h2>
          <p className="text-zinc-400 mb-8 text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ForYouPage">
              <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2">
                <Home className="w-5 h-5" />
                Go Home
              </button>
            </Link>
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage