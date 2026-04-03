"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  UserCircle2, 
  Users,
  ChevronRight,
  Images,
  Inbox,
  Briefcase,
  Trophy,
  X,
  ChevronsLeft,
  ChevronsRight,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LogoutButton from "./LogoutButton";

const SidebarItem = ({ 
  href, 
  icon: Icon, 
  label, 
  isActive,
  collapsed,
  onClick
}: { 
  href: string; 
  icon: any; 
  label: string; 
  isActive: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) => (
  <Link href={href} onClick={onClick}>
    <motion.div
      whileHover={{ x: collapsed ? 0 : 5 }}
      whileTap={{ scale: 0.98 }}
      title={collapsed ? label : undefined}
      className={`group flex items-center ${
        collapsed ? "justify-center px-3 py-4 rounded-2xl" : "justify-between px-6 py-4 rounded-[1.5rem]"
      } transition-all duration-300 ${
        isActive 
          ? "bg-blue-600 text-white shadow-xl shadow-blue-200" 
          : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <div className={`flex items-center ${collapsed ? "" : "gap-4"}`}>
        <Icon size={22} className={isActive ? "text-white" : "group-hover:text-blue-600 transition-colors"} />
        {!collapsed && <span className="text-sm font-black uppercase tracking-widest">{label}</span>}
      </div>
      {isActive && !collapsed && <ChevronRight size={16} className="text-white/50" />}
    </motion.div>
  </Link>
);

/* ── Role → visible sidebar links ────────────── */
const ALL_MENU_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Overview", roles: ["admin", "media", "events"] },
  { href: "/events", icon: Calendar, label: "Events", roles: ["admin", "events"] },
  { href: "/blogs", icon: FileText, label: "Blogs", roles: ["admin", "media"] },
  { href: "/analytics", icon: BarChart3, label: "Analytics", roles: ["admin", "media"] },
  { href: "/spotlight", icon: UserCircle2, label: "Spotlight", roles: ["admin"] },
  { href: "/team", icon: Users, label: "Team", roles: ["admin"] },
  { href: "/media", icon: Images, label: "Media", roles: ["admin", "media", "events"] },
  { href: "/submissions", icon: Inbox, label: "Submissions", roles: ["admin"] },
  { href: "/sponsors", icon: Briefcase, label: "Sponsors", roles: ["admin"] },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard", roles: ["admin"] },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.role) setRole(d.role); })
      .catch(() => {});
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose?.();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter menu items based on the user's role
  const menuItems = ALL_MENU_ITEMS.filter(
    item => !role || item.roles.includes(role)
  );

  /* ── Desktop sidebar content (supports collapsed) ── */
  const desktopContent = (
    <>
      {/* Logo Area */}
      <div className={`${collapsed ? "p-4 mb-2" : "p-8 lg:p-10 mb-4 lg:mb-6"} flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        <Link href="/" className="block">
          {collapsed ? (
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-xs font-black text-white">S</span>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">SPEUI</h1>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Admin Panel</p>
            </>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? "px-2" : "px-4 lg:px-6"} space-y-2`}>
        {!collapsed && <p className="px-6 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Main Menu</p>}
        {menuItems.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className={`${collapsed ? "px-2" : "px-4 lg:px-6"} py-4`}>
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`w-full flex items-center ${collapsed ? "justify-center" : "justify-between px-6"} py-3 rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all`}
        >
          {collapsed ? (
            <ChevronsRight size={20} />
          ) : (
            <>
              <span className="text-[10px] font-black uppercase tracking-widest">Collapse</span>
              <ChevronsLeft size={16} />
            </>
          )}
        </button>
      </div>

      {/* User Area */}
      <div className="border-t border-gray-50">
        <LogoutButton collapsed={collapsed} />
      </div>
    </>
  );

  /* ── Mobile sidebar content (always expanded) ── */
  const mobileContent = (
    <>
      <div className="p-8 lg:p-10 mb-4 lg:mb-6 flex items-center justify-between">
        <Link href="/" className="block">
          <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">SPEUI</h1>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Admin Panel</p>
        </Link>
        <button
          onClick={onMobileClose}
          className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 lg:px-6 space-y-2">
        <p className="px-6 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Main Menu</p>
        {menuItems.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
            onClick={onMobileClose}
          />
        ))}
      </nav>

      <div className="border-t border-gray-50">
        <LogoutButton />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <aside
        className="hidden lg:flex h-screen bg-white border-r border-gray-100 flex-col fixed top-0 left-0 z-40 overflow-y-auto scrollbar-hide transition-all duration-300"
        style={{ width: collapsed ? "5rem" : "20rem" }}
      >
        {desktopContent}
      </aside>

      {/* Mobile sidebar - overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 z-50 w-80 max-w-[85vw] h-screen bg-white border-r border-gray-100 flex flex-col overflow-y-auto scrollbar-hide lg:hidden"
            >
              {mobileContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
