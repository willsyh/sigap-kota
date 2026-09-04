"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  History,
  LayoutDashboard,
  Lock,
  Menu,
  MessageSquareHeart,
  UserRound,
  X,
} from "lucide-react";

import CivicBrandMark from "@/components/CivicBrandMark";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

type AdminAccess = "loading" | "allowed" | "denied";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/laporan",
    label: "Manajemen Laporan",
    icon: FileText,
    exact: false,
  },
  {
    href: "/admin/persepsi",
    label: "Persepsi Warga",
    icon: MessageSquareHeart,
    exact: false,
  },
  {
    href: "/admin/log",
    label: "Log Aktivitas",
    icon: History,
    exact: false,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [access, setAccess] = useState<AdminAccess>("loading");
  const [adminEmail, setAdminEmail] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!active) return;
        const allowed = data.user?.user_metadata?.role === "admin";
        setAccess(allowed ? "allowed" : "denied");
        setAdminEmail(data.user?.email ?? "Admin SigapKota");
      });
    return () => {
      active = false;
    };
  }, []);

  // Tutup drawer saat navigasi (pakai onClick di Link, bukan effect)
  const closeDrawer = () => setMobileNavOpen(false);

  if (access === "loading") {
    return (
      <div className="min-h-screen bg-surface p-6">
        <div className="space-y-6">
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (access === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
          <Lock className="mb-4 h-12 w-12 text-outline" />
          <h2 className="font-heading text-2xl font-semibold">Akses ditolak</h2>
          <p className="mt-2 text-sm text-outline">
            Halaman ini hanya dapat diakses oleh administrator SigapKota.
          </p>
          <Link href="/" className="mt-5">
            <Button variant="outline">Kembali ke beranda</Button>
          </Link>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center gap-3 border-b border-outline-variant/25 px-5">
        <CivicBrandMark className="h-10 w-10" />
        <div className="font-heading text-xl font-bold">
          SigapKota <span className="text-secondary">Admin</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4" aria-label="Navigasi admin">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeDrawer}
              className={`flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-outline-variant/25 p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserRound className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Admin</p>
          <p className="truncate text-xs text-outline" title={adminEmail}>
            {adminEmail || "Administrator"}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-outline-variant/30 bg-surface-lowest lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileNavOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface-lowest shadow-xl transition-transform duration-200 ease-out lg:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          aria-label="Tutup navigasi"
          onClick={() => setMobileNavOpen(false)}
          className="absolute right-4 top-5 flex h-9 w-9 items-center justify-center rounded-lg text-outline hover:bg-surface-container"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </div>

      {/* Main Container */}
      <div className="lg:ml-64">
        {/* Mobile menu trigger helper header */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-outline-variant/25 bg-surface/96 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            aria-label="Buka navigasi admin"
            onClick={() => setMobileNavOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-heading text-sm font-bold">SigapKota Admin</span>
          <Link
            href="/"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Peta Publik
          </Link>
        </div>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
