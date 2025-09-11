// src/components/chat/CharacterHeader.tsx
import React from "react";
import { Link } from "wouter";
import { useImageBlur } from "@/context/ImageBlurContext";

interface CharacterHeaderProps {
  avatarUrl: string;
  title: string;
  subtitle: React.ReactNode; // Changed from string to ReactNode to accept JSX
  isNsfw?: boolean;
  characterId?: string; // Add character ID for navigation
}

export default function CharacterHeader({ avatarUrl, title, subtitle, isNsfw = false, characterId }: CharacterHeaderProps) {
  const { shouldBlurNSFW } = useImageBlur();

  const AvatarContent = () => (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded-full blur-2xl scale-110"></div>
      <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-orange-500/40 shadow-2xl shadow-orange-500/30">
        <img 
          src={avatarUrl} 
          alt={title} 
          className="w-full h-full object-cover object-center" 
          style={{
            filter: shouldBlurNSFW(isNsfw) ? 'blur(20px)' : undefined,
            opacity: shouldBlurNSFW(isNsfw) ? 0.6 : undefined
          }}
        />
      </div>
    </div>
  );

  const TitleContent = () => (
    <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400 bg-clip-text text-transparent drop-shadow-lg">
      {title}
    </h1>
  );

  return (
    <div className="flex flex-col items-center mt-8 px-4">
      {/* Avatar - clickable if characterId is provided */}
      {characterId ? (
        <Link href={`/characters/${characterId}`}>
          <div className="cursor-pointer transition-transform hover:scale-105">
            <AvatarContent />
          </div>
        </Link>
      ) : (
        <AvatarContent />
      )}
      
      {/* Title - clickable if characterId is provided */}
      {characterId ? (
        <Link href={`/characters/${characterId}`}>
          <div className="cursor-pointer transition-transform hover:scale-105">
            <TitleContent />
          </div>
        </Link>
      ) : (
        <TitleContent />
      )}
      
      <div className="mt-3 text-center text-zinc-300 max-w-xl leading-relaxed">{subtitle}</div>
    </div>
  );
}
