"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  DollarSign,
  FileText,
  Brain,
  Activity,
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & KPIs",
  },
  {
    label: "Sites",
    href: "/sites",
    icon: Globe,
    description: "All websites",
  },
  {
    label: "Costs",
    href: "/costs",
    icon: DollarSign,
    description: "Budget tracking",
  },
  {
    label: "Conclusions",
    href: "/conclusions",
    icon: FileText,
    description: "Daily insights",
  },
  {
    label: "Forecast",
    href: "/forecast",
    icon: TrendingUp,
    description: "CPM & revenue modeling",
  },
  {
    label: "Analysis",
    href: "/analysis",
    icon: Brain,
    description: "AI analysis",
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-300"
      style={{
        width: collapsed ? 72 : 260,
        borderRight: "1px solid var(--border)",
        background: "var(--surface-0)",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-14 items-center border-b"
        style={{
          borderColor: "var(--border)",
          padding: collapsed ? "0 16px" : "0 20px",
          gap: collapsed ? 0 : 10,
        }}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500 shadow-sm shadow-indigo-500/25">
          <Activity className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex items-baseline gap-1.5 overflow-hidden">
            <span className="text-base font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
              AdKai
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--foreground-subtle)" }}>
              Analytics
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-hidden" style={{ padding: "12px 8px" }}>
        {!collapsed && (
          <p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--foreground-subtle)" }}>
            Navigation
          </p>
        )}
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group flex items-center rounded-lg text-sm font-medium transition-all duration-150",
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
                isActive
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "hover:bg-[var(--surface-2)]"
              )}
              style={
                !isActive
                  ? { color: "var(--foreground-muted)" }
                  : undefined
              }
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-150",
                  isActive
                    ? "bg-indigo-500/15 text-indigo-400"
                    : "text-[var(--foreground-subtle)] group-hover:text-[var(--foreground-muted)]"
                )}
                style={!isActive ? { background: "var(--surface-2)" } : undefined}
              >
                <Icon className="h-4 w-4" />
              </div>
              {!collapsed && (
                <>
                  <div className="flex flex-col overflow-hidden">
                    <span className="leading-tight truncate">{item.label}</span>
                    <span
                      className="text-[10px] leading-tight transition-colors truncate"
                      style={{ color: isActive ? "rgba(129, 140, 248, 0.6)" : "var(--foreground-subtle)" }}
                    >
                      {item.description}
                    </span>
                  </div>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t" style={{ borderColor: "var(--border)", padding: "12px 16px" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            {!collapsed && (
              <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
                System online
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: "var(--foreground-subtle)" }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
