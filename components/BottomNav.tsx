"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CirclePlus,
  LogIn,
  LogOut,
  Map,
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
  icon: typeof Map;
  isActive: boolean;
  opensAccount?: boolean;
  hasNotification?: boolean;
}

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);

  const taskFocused =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/laporan/baru") ||
    (pathname.startsWith("/laporan/") && pathname !== "/laporan");

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

  const tabs: TabItem[] = [
    {
      href: "/",
      label: "Beranda",
      icon: Map,
      isActive: pathname === "/",
    },
    {
      href: "/laporan",
      label: "Aktivitas",
      icon: BarChart3,
      isActive:
        pathname.startsWith("/laporan") && !pathname.startsWith("/laporan/baru"),
    },
    {
      href: "/laporan/baru",
      label: "Lapor",
      icon: CirclePlus,
      isActive: pathname.startsWith("/laporan/baru"),
    },
    ...(user?.user_metadata?.role === "admin"
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
          label: "Profil",
          icon: User,
          isActive: false,
          opensAccount: true,
        }
      : {
          href: "/auth/login",
          label: "Profil",
          icon: LogIn,
          isActive: pathname.startsWith("/auth"),
        },
  ];

  if (taskFocused) return null;

  const elevateReportAction = pathname === "/laporan";

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-surface/96 shadow-[0_-6px_24px_rgba(17,28,44,0.09)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-20 max-w-xl items-stretch px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          if (tab.opensAccount) {
            return (
              <button
                key={tab.label}
                type="button"
                aria-haspopup="dialog"
                onClick={() => setAccountOpen(true)}
                className="flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-outline transition-colors duration-150 ease-out hover:bg-surface-container/60 hover:text-primary active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="flex h-8 w-10 items-center justify-center">
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </span>
                {tab.label}
              </button>
            );
          }

          if (tab.href === "/laporan/baru" && elevateReportAction) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="group relative flex min-w-0 flex-1 flex-col items-center justify-end gap-1 pb-2 text-[11px] font-medium text-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-[0_6px_20px_rgba(142,78,20,0.28)] transition-all duration-150 ease-out group-hover:bg-secondary/90 group-active:scale-[0.94]">
                  <Icon className="h-7 w-7" strokeWidth={2.2} />
                </span>
                {tab.label}
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={tab.isActive ? "page" : undefined}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] transition-colors duration-150 ease-out hover:bg-surface-container/60 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                tab.isActive
                  ? "font-semibold text-primary"
                  : "font-medium text-outline hover:text-primary",
              )}
            >
              <span
                className="relative flex h-8 w-10 items-center justify-center"
              >
                <Icon className="h-6 w-6" strokeWidth={tab.isActive ? 2.4 : 2} />
                {tab.hasNotification && (
                  <span className="absolute right-1.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-destructive" />
                )}
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
