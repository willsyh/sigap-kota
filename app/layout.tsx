import type { Metadata } from "next";

import { QueryProvider } from "@/components/providers/QueryProvider";
import BottomNav from "@/components/BottomNav";
import { Toaster } from "@/components/ui/sonner";

import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "SigapKota",
  description: "Platform pelaporan masalah fasilitas umum berbasis peta.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <QueryProvider>
          <div>{children}</div>
          <BottomNav />
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
