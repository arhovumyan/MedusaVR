// src/components/layout/MobileNav.tsx
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Plus, Image, MessageCircle } from "lucide-react";

const navigation = [
  { name: "Home", href: "/ForYouPage", icon: Home },
  { name: "Create Character", href: "/create-character", icon: Plus },
  { name: "Create Image", href: "/generate-images", icon: Image },
  { name: "Chats", href: "/chat", icon: MessageCircle },
];

export function Footer() {
  const [location] = useLocation();

  return (
    <nav
      className={`
        fixed 
        bottom-0 
        left-0 
        right-0 
        h-16 
        bg-zinc-900/80 
        backdrop-blur-md 
        border-t 
        border-orange-500/20 
        z-30 
        flex 
        justify-around 
        items-center
        shadow-lg
        shadow-orange-500/10
      `}
    >
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive =
          location === item.href ||
          (location === "/" && item.href === "/ForYouPage");

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center space-y-1 p-3 rounded-xl transition-all duration-200",
              isActive
                ? "text-orange-400 bg-orange-500/10 scale-105"
                : "text-zinc-400 hover:text-orange-300 hover:bg-orange-500/5"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
