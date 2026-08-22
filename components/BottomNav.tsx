"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  ShieldCheck,
  User,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface TabItem {
  href: string;
  label: string;
  icon: typeof MapPin;
  isActive: boolean;
  emphasized?: boolean;
  opensAccount?: boolean;
}

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);

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
    setAccountOpen(false);
    router.push("/");
    router.refresh();
  }

  const isAdmin = user?.user_metadata?.role === "admin";

  const tabs: TabItem[] = [
    {
      href: "/",
      label: "Peta",
      icon: MapPin,
      isActive: pathname === "/",
    },
    {
      href: "/laporan",
      label: "Laporan",
      icon: FileText,
      isActive:
        pathname.startsWith("/laporan") && !pathname.startsWith("/laporan/baru"),
    },
    {
      href: "/laporan/baru",
      label: "Buat",
      icon: Plus,
      emphasized: true,
      isActive: pathname.startsWith("/laporan/baru"),
    },
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: "Admin",
            icon: ShieldCheck,
            isActive: pathname.startsWith("/admin"),
          },
        ]
      : []),
    user
      ? {
          href: "",
          label: "Akun",
          icon: User,
          isActive: false,
          opensAccount: true,
        }
      : {
          href: "/auth/login",
          label: "Masuk",
          icon: LogIn,
          isActive: pathname.startsWith("/auth"),
        },
  ];

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          if (tab.emphasized) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={tab.isActive ? "page" : undefined}
                className="group relative flex flex-1 flex-col items-center justify-end gap-1 pb-1.5 text-[10px] font-medium"
              >
                <span
                  className={cn(
                    "absolute -top-5 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all group-active:scale-95",
                    tab.isActive
                      ? "bg-secondary text-secondary-foreground ring-2 ring-secondary/40"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={
                    tab.isActive ? "text-primary font-semibold" : "text-muted-foreground"
                  }
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          if (tab.opensAccount) {
            return (
              <button
                key={tab.label}
                type="button"
                aria-haspopup="dialog"
                onClick={() => setAccountOpen(true)}
                className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="flex h-7 w-9 items-center justify-center rounded-lg transition-colors">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {tab.label}
              </button>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={tab.isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors",
                tab.isActive
                  ? "font-semibold text-primary"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-9 items-center justify-center rounded-lg transition-colors",
                  tab.isActive && "bg-accent",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>

      <Dialog open={accountOpen} onOpenChange={(open) => setAccountOpen(open)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Akun</DialogTitle>
            <DialogDescription>{user?.email}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
