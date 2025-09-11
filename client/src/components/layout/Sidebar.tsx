// src/components/layout/Sidebar.tsx
import { Link } from "wouter";
import { MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { createContext } from "react";
import clsx from "clsx";
// Import removed - using direct path to logo.svg
import { SidebarItem } from "./SidebarItems";
import { sidebarItems } from "@/constants/SidebarInfo";
import { useAuth } from "@/hooks/useAuth";

export const SidebarContext = createContext<{ expanded: boolean }>({ expanded: true });

interface Sidebar2Props {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: Sidebar2Props) {
  const { user } = useAuth();

  return (
    <aside
      className={`
        fixed top-0 left-0 bottom-0
        ${isCollapsed ? 'w-16' : 'w-64'} 
        bg-zinc-900/95 backdrop-blur-md border-r border-orange-500/20
        shadow-2xl shadow-orange-500/10
        z-40 
        transform 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        transition-all duration-300 ease-in-out
        flex flex-col
      `}
    >
      {/* Logo + controls */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4 pb-2'} flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center ${isCollapsed ? '' : 'border-b border-orange-500/20'}`}>
        {isCollapsed ? (
          <Link href="/" onClick={onClose} className="group">
            <img
              src="/medusaSnake.png"
              alt="MedusaVR Logo"
              className="w-8 h-8 transition-all duration-300 ease-out cursor-pointer group-hover:scale-110"
            />
          </Link>
        ) : (
          <Link href="/" onClick={onClose}>
            <img
              src="/medusaSnake.png"
              alt="MedusaVR Logo"
              className="w-20 h-20 transition-all duration-300 ease-out cursor-pointer hover:scale-105"
            />
          </Link>
        )}
        
        
      </div>

      {/* Menu items (flex-1 pushes next section to bottom) */}
      <SidebarContext.Provider value={{ expanded: !isCollapsed }}>
        <ul className={`flex-1 ${isCollapsed ? 'px-1 py-2' : 'px-3'} overflow-y-auto`}>
          {sidebarItems.map((entry, idx) => {
            if ((entry as any).divider) {
              return isCollapsed ? null : <hr key={idx} className="my-3 border-orange-500/20" />;
            }
            
            if (entry.route) {
              // Handle dynamic profile route
              const actualRoute = entry.text === "Profile" && user?.id 
                ? `/user-profile/${user.id}`
                : entry.route;
                
              return (
                <li key={idx} className="w-full">
                  <Link 
                    href={actualRoute} 
                    data-sidebar-item={entry.text}
                    className={clsx(
                      "relative flex items-center rounded-md transition-all group w-full cursor-pointer text-zinc-300 hover:text-orange-400 duration-150 no-underline",
                      isCollapsed 
                        ? "p-2 justify-center mb-1 mx-auto w-12 h-12" 
                        : "px-3 py-2 gap-2",
                      // Add hover background
                      "hover:bg-orange-500/10"
                    )}
                    onClick={() => {
                      console.log('Sidebar link clicked:', actualRoute, entry.text);
                      if (!isCollapsed) {
                        onClose();
                      }
                    }}
                  >
                    {/* Icon always visible */}
                    <div className={clsx("flex-shrink-0 transition-colors", isCollapsed && "justify-center items-center")}>
                      {entry.icon}
                    </div>

                    {/* Text label only if not collapsed */}
                    {!isCollapsed && (
                      <span className="flex-1 text-sm font-medium whitespace-nowrap transition-colors">
                        {entry.text}
                      </span>
                    )}

                    {/* Tooltip (only in collapsed mode) */}
                    {isCollapsed && (
                      <div
                        className={clsx(
                          "absolute left-full ml-2 whitespace-nowrap rounded-md bg-zinc-800/95 backdrop-blur-sm border border-orange-500/30 px-2 py-1 text-xs text-orange-200 shadow-lg shadow-orange-500/10 transition-opacity duration-150 z-50",
                          "invisible opacity-0 group-hover:visible group-hover:opacity-100"
                        )}
                      >
                        {entry.text}
                      </div>
                    )}
                  </Link>
                </li>
              );
            } else {
              return (
                <li key={idx} className="w-full">
                  <div className={clsx(
                    "w-full opacity-50 cursor-default relative flex items-center rounded-md transition-all group",
                    isCollapsed 
                      ? "p-2 justify-center mb-1 mx-auto w-12 h-12" 
                      : "px-3 py-2 gap-2"
                  )}>
                    {/* Icon always visible */}
                    <div className={clsx("flex-shrink-0 transition-colors", isCollapsed && "justify-center items-center")}>
                      {entry.icon}
                    </div>

                    {/* Text label only if not collapsed */}
                    {!isCollapsed && (
                      <span className="flex-1 text-sm font-medium whitespace-nowrap transition-colors">
                        {entry.text}
                      </span>
                    )}

                    {/* Tooltip (only in collapsed mode) */}
                    {isCollapsed && (
                      <div
                        className={clsx(
                          "absolute left-full ml-2 whitespace-nowrap rounded-md bg-zinc-800/95 backdrop-blur-sm border border-orange-500/30 px-2 py-1 text-xs text-orange-200 shadow-lg shadow-orange-500/10 transition-opacity duration-150 z-50",
                          "invisible opacity-0 group-hover:visible group-hover:opacity-100"
                        )}
                      >
                        {entry.text}
                      </div>
                    )}
                  </div>
                </li>
              );
            }
          })}
        </ul>
      </SidebarContext.Provider>

      {/* User info pinned to the bottom */}
      <div className={`flex ${isCollapsed ? 'p-2 justify-center' : 'p-3'} items-center ${isCollapsed ? '' : 'border-t border-orange-500/20 bg-orange-500/5'}`}>
        {isCollapsed ? (
          <div className="relative group">
            <img
              src={user?.avatarUrl || `https://ui-avatars.com/api/?background=ea580c&color=ffffff&bold=true&name=${encodeURIComponent(user?.username || 'Guest')}`}
              alt="User avatar"
              className="w-8 h-8 rounded-md border border-orange-500/30 flex-shrink-0 cursor-pointer transition-all duration-200 group-hover:scale-110"
            />
            {/* Tooltip for collapsed state */}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-800/95 backdrop-blur-sm border border-orange-500/30 px-2 py-1 text-xs text-orange-200 shadow-lg shadow-orange-500/10 transition-opacity duration-150 z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100">
              {user?.username || 'Guest User'}
            </div>
          </div>
        ) : (
          <>
            <img
              src={user?.avatarUrl || `https://ui-avatars.com/api/?background=ea580c&color=ffffff&bold=true&name=${encodeURIComponent(user?.username || 'Guest')}`}
              alt="User avatar"
              className="w-10 h-10 rounded-md border border-orange-500/30 flex-shrink-0"
            />
            <div className="ml-3 leading-4 text-white flex-1 min-w-0 overflow-hidden">
              <h4 className="font-semibold text-orange-200 truncate text-sm">{user?.username || 'Guest User'}</h4>
              <span className="text-xs text-orange-300/60 truncate block">{user?.email || 'Not signed in'}</span>
            </div>
            <MoreVertical size={16} className="text-orange-400/70 hover:text-orange-400 cursor-pointer transition-colors flex-shrink-0 ml-2" />
          </>
        )}
      </div>
    </aside>
  );
}
