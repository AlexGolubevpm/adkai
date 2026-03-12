"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { RefreshCw, Download, Bell } from "lucide-react";
import Sidebar from "@/components/sidebar";
import PeriodFilter, { type PeriodValue } from "@/components/period-filter";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Performance overview" },
  "/sites": { title: "Sites", subtitle: "Website management" },
  "/costs": { title: "Costs", subtitle: "Budget tracking" },
  "/conclusions": { title: "Conclusions", subtitle: "AI-generated insights" },
  "/forecast": { title: "Forecast", subtitle: "Revenue modeling" },
  "/analysis": { title: "Analysis", subtitle: "AI analysis engine" },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 260;
  const pathname = usePathname();

  const basePath = "/" + (pathname.split("/")[1] || "dashboard");
  const pageInfo = pageTitles[basePath] || { title: "Dashboard", subtitle: "" };

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Top Context Bar */}
        <header className="topbar">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="page-heading" style={{ fontSize: "var(--text-xl)" }}>
                {pageInfo.title}
              </h1>
              <p style={{
                fontSize: "var(--text-xs)",
                color: "var(--foreground-subtle)",
                marginTop: 1,
              }}>
                {pageInfo.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="flex items-center justify-center rounded-lg transition-colors"
              style={{
                width: 36,
                height: 36,
                color: "var(--foreground-subtle)",
                border: "1px solid var(--border)",
                background: "var(--surface-0)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-hover)";
                e.currentTarget.style.color = "var(--foreground-muted)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--foreground-subtle)";
              }}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              className="flex items-center justify-center rounded-lg transition-colors"
              style={{
                width: 36,
                height: 36,
                color: "var(--foreground-subtle)",
                border: "1px solid var(--border)",
                background: "var(--surface-0)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-hover)";
                e.currentTarget.style.color = "var(--foreground-muted)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--foreground-subtle)";
              }}
              title="Export"
            >
              <Download className="h-4 w-4" />
            </button>

            <div
              style={{
                width: 1,
                height: 24,
                background: "var(--border)",
                margin: "0 4px",
              }}
            />

            <div
              className="flex items-center gap-2 rounded-lg"
              style={{
                padding: "6px 12px",
                background: "var(--success-light)",
                color: "var(--success)",
                fontSize: "var(--text-xs)",
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--success)",
                  display: "inline-block",
                }}
              />
              Live
            </div>
          </div>
        </header>

        {/* Page Canvas */}
        <main className="app-canvas" style={{ maxWidth: 1440, margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
