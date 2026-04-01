"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

const COLLAPSED_KEY = "sidebar_collapsed";

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const isLoginPage = pathname === "/login";
  const isDevPage = pathname.startsWith("/dev");

  // Restore collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_KEY);
      if (saved === "true") setCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(COLLAPSED_KEY, String(next)); } catch {}
      return next;
    });
  };

  if (isLoginPage || isDevPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />

      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <Menu size={22} />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black text-gray-900 tracking-tight leading-none">SPEUI</h1>
          <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest leading-none">Admin</p>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      <main
        className="flex-1 min-h-screen pt-14 lg:pt-0 transition-[margin] duration-300"
        style={{ marginLeft: undefined }}
      >
        {/* Use CSS classes for responsive margin that matches sidebar width */}
        <style>{`
          @media (min-width: 1024px) {
            .sidebar-main-content {
              margin-left: ${collapsed ? "5rem" : "20rem"};
              transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
          }
        `}</style>
        <div className="sidebar-main-content">
          {children}
        </div>
      </main>
    </div>
  );
}
