// src/components/layout/SidebarItem.tsx
import { useContext } from "react";
import { SidebarContext } from "./Sidebar";
import clsx from "clsx";

type SidebarItemProps = {
  icon?: JSX.Element;
  text?: string;
  alert?: boolean;
  divider?: boolean;
  active?: boolean;
  isCollapsed?: boolean;
};
export function SidebarItem({
  icon,
  text,
  active = false,
  alert = false,
  isCollapsed = false,
}: SidebarItemProps) {
  const { expanded } = useContext(SidebarContext);

  return (
    <div className="flex items-center gap-2 relative w-full">
      {/* 1) Icon always visible */}
      <div className={clsx("flex-shrink-0 transition-colors", isCollapsed && "justify-center items-center")}>
        {icon}
      </div>

      {/* 2) Text label only if not collapsed */}
      {!isCollapsed && (
        <span className="flex-1 text-sm font-medium whitespace-nowrap transition-colors">
          {text}
        </span>
      )}

      {/* 3) Tooltip (only in collapsed mode) */}
      {isCollapsed && (
        <div
          className={clsx(
            "absolute left-full ml-2 whitespace-nowrap rounded-md bg-zinc-800/95 backdrop-blur-sm border border-orange-500/30 px-2 py-1 text-xs text-orange-200 shadow-lg shadow-orange-500/10 transition-opacity duration-150 z-50",
            "invisible opacity-0 group-hover:visible group-hover:opacity-100"
          )}
        >
          {text}
        </div>
      )}
    </div>
  );
}
