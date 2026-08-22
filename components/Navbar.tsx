"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MapPin, FileText, PlusCircle, ShieldCheck, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await createClient().auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

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

          {user ? (
            <div className="flex items-center gap-2">
              <span
                className="hidden sm:inline max-w-[140px] truncate text-xs text-muted-foreground"
                title={user.email ?? ""}
              >
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </Button>
            </div>
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                Masuk
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
