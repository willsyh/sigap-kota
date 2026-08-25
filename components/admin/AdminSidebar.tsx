"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Trash2, UserRound } from "lucide-react";

import CivicBrandMark from "@/components/CivicBrandMark";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  adminEmail: string;
}

const MENU_ITEMS = [
  { href: "/admin", label: "Manajemen Laporan", icon: FileText },
  { href: "/admin/laporan-terhapus", label: "Laporan Terhapus", icon: Trash2 },
];

export default function AdminSidebar({ adminEmail }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-outline-variant/30 bg-surface-lowest lg:flex">
      <div className="flex h-20 items-center gap-3 border-b border-outline-variant/25 px-5">
        <CivicBrandMark className="h-10 w-10" />
        <div className="font-heading text-xl font-bold">SigapKota <span className="text-secondary">Admin</span></div>
      </div>
      <nav className="flex-1 space-y-2 p-4" aria-label="Navigasi admin">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-container",
              )}
            >
              <Icon className="h-5 w-5" />{item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-3 border-t border-outline-variant/25 p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><UserRound className="h-5 w-5" /></span>
        <div className="min-w-0"><p className="text-sm font-semibold">Admin</p><p className="truncate text-xs text-outline" title={adminEmail}>{adminEmail || "Administrator"}</p></div>
      </div>
    </aside>
  );
}
