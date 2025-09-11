// src/components/layout/AppLayout.tsx
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { DebugNavigation } from "@/components/debug/DebugNavigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white relative">
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/*
        2) Overlay: only rendered when sidebarOpen is true and not collapsed.
           It sits under the sidebar (z-30) and above the blurred content.
           Clicking it will close the sidebar.
      */}
      {sidebarOpen && !sidebarCollapsed && (
        <div className="fixed inset-0 bg-transparent z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/*
        3) Wrap the rest of the app (header, main, footer) in a blur wrapper.
           When sidebarOpen is true AND not collapsed, apply `filter blur-sm`.
      */}
      <div className={`
          transition-all duration-500 ease-in-out
          ${sidebarOpen && !sidebarCollapsed ? "filter blur-sm" : ""}
        `}
      >
        {/* 4) Header is visible (blurred when sidebarOpen) */}
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        {/* 5) Main content with proper top padding to avoid header overlap and bottom margin for footer */}
        <main className="pt-24 pb-20 px-6 min-h-screen">{children}</main>

        {/* 6) Footer always spans full width */}
        <Footer />
      </div>
    </div>
  );
}
