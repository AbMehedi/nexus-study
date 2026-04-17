"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  CalendarClock,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  ChevronLeft,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/tasks",
    label: "Tasks",
    icon: CheckSquare,
    exact: false,
  },
  {
    href: "/dashboard/projects",
    label: "Projects",
    icon: FolderKanban,
    exact: false,
  },
  {
    href: "/dashboard/schedule",
    label: "Schedule",
    icon: CalendarClock,
    exact: false,
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart2,
    exact: false,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    exact: false,
  },
];

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
        collapsed && "justify-center px-2.5"
      )}
    >
      <Icon
        className={cn(
          "h-4.5 w-4.5 shrink-0 transition-transform duration-200",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
          !collapsed && "group-hover:scale-110"
        )}
        aria-hidden="true"
      />
      {!collapsed && (
        <span className="truncate">{label}</span>
      )}
      {isActive && !collapsed && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
      )}
    </Link>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
  };

  const avatarLetter = user?.displayName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "?";
  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "User";

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div
        className={cn(
          "flex items-center gap-2.5 px-4 py-5 border-b border-border/50",
          collapsed && "justify-center px-3"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
          <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground leading-none">Academic</p>
            <p className="text-xs text-primary font-semibold leading-tight mt-0.5">Nexus</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1" aria-label="Dashboard navigation">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.href}
            {...link}
            collapsed={collapsed}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-border/50 p-3 space-y-1">
        <div
          className={cn(
            "flex items-center gap-3 px-2 py-2 rounded-lg",
            collapsed && "justify-center"
          )}
        >
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold ring-2 ring-primary/20">
            {avatarLetter}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200",
            collapsed && "justify-center px-2.5"
          )}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        id="dashboard-sidebar"
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 glass-sidebar",
          collapsed ? "w-16" : "w-60"
        )}
        aria-label="Sidebar"
      >
        {sidebarContent}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute -right-3 top-20 flex h-6 w-6 items-center justify-center",
            "rounded-full bg-card border border-border text-muted-foreground",
            "hover:border-primary hover:text-primary transition-colors shadow-md"
          )}
        >
          <ChevronLeft
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>
      </aside>

      {/* ── Mobile: Top bar with hamburger ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 glass border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 border border-primary/20">
            <Zap className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold">Academic Nexus</span>
        </div>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* ── Mobile: Drawer ── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <aside
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 glass-sidebar animate-slide-down"
            aria-label="Mobile navigation"
          >
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
