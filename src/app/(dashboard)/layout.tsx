"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className="min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
