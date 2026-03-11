import Sidebar from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <main className="ml-[260px] min-h-screen">
        <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
