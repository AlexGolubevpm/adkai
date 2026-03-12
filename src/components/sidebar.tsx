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
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Sites",
    href: "/sites",
    icon: Globe,
  },
  {
    label: "Costs",
    href: "/costs",
    icon: DollarSign,
  },
  {
    label: "Conclusions",
    href: "/conclusions",
    icon: FileText,
  },
  {
    label: "Forecast",
    href: "/forecast",
    icon: TrendingUp,
  },
  {
    label: "Analysis",
    href: "/analysis",
    icon: Brain,
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
      className="fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-300 ease-[var(--ease-out)]"
      style={{
        width: collapsed ? 72 : 260,
        background: "var(--surface-0)",
        borderRight: "1px solid var(--border)",
        boxShadow: "var(--shadow-sidebar)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center shrink-0"
        style={{
          height: "var(--topbar-height)",
          borderBottom: "1px solid var(--border)",
          padding: collapsed ? "0 16px" : "0 20px",
          gap: 12,
        }}
      >
        <div
          className="flex shrink-0 items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
          }}
        >
          <Activity className="h-[18px] w-[18px] text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--foreground)",
                lineHeight: 1.2,
              }}
            >
              AdKai
            </span>
            <span
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 500,
                color: "var(--foreground-subtle)",
                letterSpacing: "0.02em",
              }}
            >
              Analytics Platform
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          padding: collapsed ? "16px 10px" : "16px 12px",
        }}
      >
        {!collapsed && (
          <p
            style={{
              padding: "0 12px 8px",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--foreground-subtle)",
            }}
          >
            Navigation
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                  "flex items-center transition-all duration-200",
                  collapsed ? "justify-center" : "gap-3"
                )}
                style={{
                  height: collapsed ? 44 : 42,
                  borderRadius: "var(--radius-md)",
                  padding: collapsed ? "0" : "0 12px",
                  fontSize: "var(--text-sm)",
                  fontWeight: isActive ? 600 : 500,
                  ...(isActive
                    ? {
                        background: "var(--primary-light)",
                        color: "var(--primary)",
                        boxShadow: "inset 3px 0 0 var(--primary)",
                      }
                    : {
                        color: "var(--foreground-muted)",
                        background: "transparent",
                      }),
                }}
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
                  className="flex shrink-0 items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <Icon
                    style={{
                      width: 18,
                      height: 18,
                      color: isActive ? "var(--primary)" : "inherit",
                    }}
                  />
                </div>
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <ChevronRight
                        style={{
                          width: 14,
                          height: 14,
                          marginLeft: "auto",
                          opacity: 0.5,
                        }}
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
        className="shrink-0 flex items-center"
        style={{
          borderTop: "1px solid var(--border)",
          padding: collapsed ? "12px 16px" : "14px 16px",
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md)",
                background: "var(--surface-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                color: "var(--foreground-muted)",
              }}
            >
              AK
            </div>
            <div style={{ overflow: "hidden" }}>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--foreground)",
                  lineHeight: 1.2,
                }}
              >
                Admin
              </p>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--foreground-subtle)",
                  lineHeight: 1.2,
                }}
              >
                AdKai Pro
              </p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="flex items-center justify-center rounded-md transition-colors cursor-pointer"
          style={{
            width: 32,
            height: 32,
            color: "var(--foreground-subtle)",
            border: "1px solid var(--border)",
            background: "var(--surface-0)",
            borderRadius: "var(--radius-md)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--surface-2)";
            e.currentTarget.style.borderColor = "var(--border-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--surface-0)";
            e.currentTarget.style.borderColor = "var(--border)";
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
