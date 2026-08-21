"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, FileText, PlusCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Peta Utama", icon: MapPin },
    { href: "/laporan", label: "Daftar Laporan", icon: FileText },
    { href: "/admin", label: "Panel Admin", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <MapPin className="h-5 w-5 text-primary" />
            <span>SigapKota</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/laporan/baru">
            <Button size="sm" className="h-8 gap-1 text-xs">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Buat Laporan</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
