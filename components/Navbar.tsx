"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  Layers3,
  LogIn,
  LogOut,
  Map,
  Menu,
  ShieldCheck,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface NavbarProps {
  viewMode?: "marker" | "heatmap";
  onViewModeToggle?: () => void;
}

export default function Navbar({ viewMode, onViewModeToggle }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await createClient().auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const isAdmin = user?.user_metadata?.role === "admin";
  const navItems = [
    { href: "/", label: "Peta", icon: Map },
    { href: "/laporan", label: "Laporan", icon: FileText },
    ...(isAdmin
      ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-outline-variant/25 bg-surface/96 shadow-sm backdrop-blur-md">
      <div className="relative mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link
          href="/laporan"
          aria-label="Buka daftar laporan"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        >
          <Menu className="h-6 w-6" />
        </Link>

        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 font-heading text-xl font-bold tracking-[-0.035em] text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:static md:translate-x-0"
          >
            SigapKota
          </Link>

          <nav aria-label="Navigasi desktop" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-10 gap-2 text-on-surface-variant"
              title={user.email ?? undefined}
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </Button>
          ) : (
            <Link
              href="/auth/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-10 gap-2",
              )}
            >
              <LogIn className="h-4 w-4" />
              Masuk
            </Link>
          )}
        </div>

        {onViewModeToggle ? (
          <button
            type="button"
            onClick={onViewModeToggle}
            aria-label={viewMode === "marker" ? "Tampilkan heatmap" : "Tampilkan pin laporan"}
            aria-pressed={viewMode === "heatmap"}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          >
            <Layers3 className="h-5 w-5" />
          </button>
        ) : (
          <Link
            href="/"
            aria-label="Buka tampilan peta"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          >
            <Layers3 className="h-5 w-5" />
          </Link>
        )}
      </div>
    </header>
  );
}
