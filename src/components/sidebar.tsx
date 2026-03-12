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
    description: "Revenue modeling",
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
      className="fixed left-0 top-0 z-40 flex h-screen flex-col bg-white transition-all duration-300 ease-[var(--ease-out)]"
      style={{
        width: collapsed ? 68 : 256,
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-14 items-center shrink-0"
        style={{
          borderBottom: "1px solid var(--border)",
          padding: collapsed ? "0 14px" : "0 20px",
          gap: 10,
        }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: "var(--primary)",
            boxShadow: "0 1px 3px rgba(99, 102, 241, 0.3)",
          }}
        >
          <Activity className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex items-baseline gap-1.5 overflow-hidden">
            <span
              className="text-[15px] font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              AdKai
            </span>
            <span
              className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: "var(--foreground-subtle)" }}
            >
              Analytics
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3" style={{ padding: collapsed ? "12px 8px" : "12px" }}>
        {!collapsed && (
          <p
            className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--foreground-subtle)" }}
          >
            Menu
          </p>
        )}
        <div className="space-y-0.5">
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
                  "group flex items-center rounded-lg text-[13px] font-medium transition-all duration-200",
                  collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
                )}
                style={
                  isActive
                    ? {
                        background: "var(--primary-light)",
                        color: "var(--primary)",
                      }
                    : {
                        color: "var(--foreground-muted)",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--surface-2)";
                    e.currentTarget.style.color = "var(--foreground)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--foreground-muted)";
                  }
                }}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors"
                  )}
                  style={
                    isActive
                      ? { color: "var(--primary)" }
                      : { color: "var(--foreground-subtle)" }
                  }
                >
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                {!collapsed && (
                  <>
                    <div className="flex flex-col overflow-hidden">
                      <span className="leading-tight truncate">{item.label}</span>
                      <span
                        className="text-[10px] leading-tight truncate"
                        style={{
                          color: isActive
                            ? "var(--primary)"
                            : "var(--foreground-subtle)",
                          opacity: isActive ? 0.7 : 1,
                        }}
                      >
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div
                        className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: "var(--primary)" }}
                      />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div
        className="shrink-0 flex items-center justify-between"
        style={{
          borderTop: "1px solid var(--border)",
          padding: collapsed ? "12px 14px" : "12px 16px",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          {!collapsed && (
            <span className="text-[11px] font-medium" style={{ color: "var(--foreground-subtle)" }}>
              System online
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer"
          style={{ color: "var(--foreground-subtle)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--surface-2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
