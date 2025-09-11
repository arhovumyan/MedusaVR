// Example demonstrating the new utility classes from index.css
import React from 'react';
import { Star, User } from 'lucide-react';

export function UtilityClassesDemo() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold gradient-text-orange">
        Design System Demo
      </h1>
      
      {/* Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold text-orange-400 mb-3">Glass Card</h3>
          <p className="text-zinc-300">
            This card uses the `.glass-card` utility class with consistent orange glowy theme.
          </p>
        </div>
        
        <div className="glass-card-strong p-6">
          <h3 className="text-xl font-semibold text-orange-400 mb-3">Strong Glass Card</h3>
          <p className="text-zinc-300">
            This card uses `.glass-card-strong` for more pronounced effects.
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-4">
        <button className="btn-orange-glow">
          <Star className="w-4 h-4 mr-2" />
          Glowy Button
        </button>
        
        <button className="glass-card px-4 py-2 hover:bg-orange-500/10 transition-colors">
          Glass Button
        </button>
      </div>

      {/* Avatar Examples */}
      <div className="flex items-center space-x-6">
        <div className="avatar-glow w-16 h-16">
          <img 
            src="https://ui-avatars.com/api/?background=ea580c&color=ffffff&bold=true&name=Demo" 
            alt="Demo avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="avatar-glow w-12 h-12">
          <div className="w-full h-full bg-orange-500 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Input Example */}
      <div className="max-w-md">
        <input 
          type="text" 
          placeholder="Try the input glow effect..." 
          className="input-glow w-full"
        />
      </div>

      {/* Text Examples */}
      <div className="space-y-2">
        <h2 className="gradient-text-orange text-2xl font-bold">
          Gradient Text Orange
        </h2>
        <p className="text-shadow-glow text-orange-400">
          Text with orange glow shadow
        </p>
      </div>
    </div>
  );
}
