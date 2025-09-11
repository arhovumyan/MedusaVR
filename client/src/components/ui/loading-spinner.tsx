import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  text?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

export function LoadingSpinner({ 
  size = 'md', 
  className, 
  showText = true, 
  text = 'Loading...' 
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className="relative">
        {/* Outer pulsing blurry ring - red to orange gradient */}
        <div className={cn(
          'absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse',
          'bg-gradient-to-r from-red-500 via-orange-500 to-red-500',
          sizeClasses[size]
        )} 
        style={{
          transform: 'scale(1.2)',
          animationDuration: '2s',
        }} />
        
        {/* Secondary pulsing ring */}
        <div className={cn(
          'absolute inset-0 rounded-full blur-lg opacity-40 animate-pulse',
          'bg-gradient-to-r from-orange-400 via-red-400 to-orange-400',
          sizeClasses[size]
        )} 
        style={{
          transform: 'scale(1.4)',
          animationDuration: '2.5s',
          animationDelay: '0.5s',
        }} />
        
        {/* Outer rotating ring */}
        <div className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 blur-md opacity-20 animate-spin',
          sizeClasses[size]
        )} 
        style={{
          animationDuration: '3s',
        }} />
        
        {/* Logo container with subtle rotation */}
        <div className={cn(
          'relative rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-orange-500/20 flex items-center justify-center',
          'shadow-2xl shadow-orange-500/10 animate-slow-spin',
          sizeClasses[size]
        )}>
          {/* MedusaVR Logo */}
          <img 
            src="/medusaSnake.png" 
            alt="MedusaVR" 
            className="w-3/4 h-3/4 object-contain opacity-90"
            onError={(e) => {
              // Fallback to a simple spinning circle if logo fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = '<div class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>';
            }}
          />
        </div>
      </div>
      
      {showText && (
        <p className="mt-6 text-sm text-zinc-300 animate-pulse font-medium">
          {text}
        </p>
      )}
    </div>
  );
}

export default LoadingSpinner; 