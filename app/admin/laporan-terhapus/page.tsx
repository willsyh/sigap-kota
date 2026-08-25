"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  RotateCcw,
  Trash2,
} from "lucide-react";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CATEGORY_LABELS,
} from "@/lib/constants/reports";
import { createClient } from "@/lib/supabase/client";
import type { DeletedReportItem } from "@/app/api/admin/laporan-terhapus/route";

type AdminAccess = "loading" | "allowed" | "denied";

async function fetchDeleted(): Promise<DeletedReportItem[]> {
  const response = await fetch("/api/admin/laporan-terhapus");
  if (!response.ok) throw new Error("Gagal memuat laporan terhapus");
  return response.json();
}

export default function DeletedReportsPage() {
  const queryClient = useQueryClient();
  const [access, setAccess] = useState<AdminAccess>("loading");
  const [adminEmail, setAdminEmail] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    createClient().auth.getUser().then(({ data }) => {
      if (!active) return;
      const allowed =
        data.user?.user_metadata?.role === "admin" ||
        data.user?.app_metadata?.role === "admin";
      setAccess(allowed ? "allowed" : "denied");
      setAdminEmail(data.user?.email ?? "Admin SigapKota");
    });
    return () => { active = false; };
  }, []);

  const { data: items = [], isLoading, isError, refetch } = useQuery<DeletedReportItem[]>({
    queryKey: ["deleted_reports"],
    queryFn: fetchDeleted,
    enabled: access === "allowed",
  });

  const restoreMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/laporan/${reportId}/restore`, { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Gagal memulihkan laporan");
      }
      return response.json();
    },
    onMutate: (reportId) => setRestoringId(reportId),
    onSuccess: () => {
      toast.success("Laporan berhasil dipulihkan.");
      queryClient.invalidateQueries({ queryKey: ["deleted_reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin_reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setRestoringId(null),
  });

  return (
    <div className="min-h-screen bg-surface">
      <AdminSidebar adminEmail={adminEmail} />

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-outline-variant/25 bg-surface/96 px-4 shadow-sm backdrop-blur-md sm:px-6">
          <Link
            href="/admin"
            aria-label="Kembali ke manajemen laporan"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="font-heading text-xl font-bold">Laporan Terhapus</h1>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {access === "loading" || isLoading ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : access === "denied" ? (
            <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center text-center">
              <Lock className="mb-4 h-12 w-12 text-outline" />
              <h2 className="font-heading text-2xl font-semibold">Akses ditolak</h2>
              <p className="mt-2 text-sm text-outline">Halaman ini hanya dapat diakses oleh administrator SigapKota.</p>
              <Link href="/" className="mt-5"><Button variant="outline">Kembali ke beranda</Button></Link>
            </div>
          ) : isError ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
              <AlertCircle className="mb-3 h-11 w-11 text-destructive" />
              <h2 className="font-heading text-xl font-semibold">Gagal memuat data</h2>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>Coba lagi</Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <CheckCircle2 className="mb-3 h-12 w-12 text-tertiary" />
              <h2 className="font-heading text-xl font-semibold">Tidak ada laporan terhapus</h2>
              <p className="mt-1 text-sm text-outline">Semua laporan aman dan tidak ada yang dihapus.</p>
            </div>
          ) : (
            <section className="overflow-hidden rounded-xl border border-outline-variant/25 bg-surface-lowest shadow-[0_2px_12px_rgba(0,109,119,0.05)]">
              <div className="border-b border-outline-variant/30 p-5 sm:p-6">
                <h2 className="font-heading text-xl font-semibold">Riwayat penghapusan</h2>
                <p className="mt-1 text-sm text-outline">Laporan yang sudah dipulihkan tetap tampil di riwayat dengan aksi nonaktif.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/30 bg-surface-low text-xs font-bold uppercase tracking-wider text-outline">
                      <th className="p-4">Judul laporan</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4">Dihapus oleh</th>
                      <th className="p-4">Alasan</th>
                      <th className="p-4">Tanggal dihapus</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/25">
                    {items.map((item) => {
                      const restored = item.current_status === null;
                      return (
                        <tr key={item.log_id} className="transition-colors hover:bg-surface-low/70">
                          <td className="max-w-xs p-4">
                            <Link href={`/laporan/${item.report_id}`} className="truncate text-sm font-medium hover:text-primary">
                              {item.title ?? "(tanpa judul)"}
                            </Link>
                            {!restored && item.title && (
                              <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">Terhapus</span>
                            )}
                          </td>
                          <td className="p-4"><span className="rounded bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-variant">{CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ?? item.category ?? "-"}</span></td>
                          <td className="p-4">
                            <p className="text-sm">{item.deleted_by_email ?? "-"}</p>
                            <span className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${item.deleted_by_role === "admin" ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant"}`}>
                              {item.deleted_by_role}
                            </span>
                          </td>
                          <td className="max-w-xs p-4"><p className="line-clamp-2 text-sm text-on-surface-variant">{item.reason ?? "-"}</p></td>
                          <td className="p-4"><p className="text-sm tabular-nums">{item.deleted_at ? new Date(item.deleted_at).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}</p></td>
                          <td className="p-4 text-right">
                            {restored ? (
                              <span className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-tertiary/30 bg-tertiary/10 px-3 text-xs font-medium text-tertiary">
                                <CheckCircle2 className="h-4 w-4" />Dipulihkan
                              </span>
                            ) : (
                              <Button
                                variant="outline"
                                disabled={restoringId === item.report_id}
                                onClick={() => restoreMutation.mutate(item.report_id)}
                                className="h-10 gap-2"
                              >
                                {restoringId === item.report_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                Pulihkan
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-outline-variant/30 bg-surface px-5 py-4 text-xs text-outline">
                <span>{items.length} entri penghapusan</span>
                <span className="flex items-center gap-1"><Trash2 className="h-3 w-3" />Data laporan tersimpan sampai dipulihkan</span>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
