import type { Metadata } from "next";
import { Geist, Geist_Mono, Hanken_Grotesk } from "next/font/google";

import { QueryProvider } from "@/components/providers/QueryProvider";
import BottomNav from "@/components/BottomNav";
import { Toaster } from "@/components/ui/sonner";

import "leaflet/dist/leaflet.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

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
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${hankenGrotesk.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <QueryProvider>
          {/* Ruang untuk BottomNav agar konten tidak tertutup di layar kecil */}
          <div className="pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </div>
          <BottomNav />
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
