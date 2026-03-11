import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdKai - Analytics Dashboard",
  description: "Premium analytics dashboard for ad network management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
