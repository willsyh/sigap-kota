"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardClock,
  Download,
  Eye,
  FileText,
  History,
  ImageOff,
  ImagePlus,
  Layers3,
  Loader2,
  Lock,
  MapPin,
  Menu,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ThumbsUp,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";

import CivicBrandMark from "@/components/CivicBrandMark";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABELS,
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  STATUS_LABELS,
  STATUS_META,
} from "@/lib/constants/reports";
import {
  PERCEPTION_REASON_LABELS,
  PERCEPTION_REASONS,
  PERCEPTION_SENTIMENTS,
  PERCEPTION_SENTIMENT_COLORS,
  PERCEPTION_SENTIMENT_LABELS,
} from "@/lib/constants/perceptions";
import { createClient } from "@/lib/supabase/client";
import type {
  DeletionLogRow,
  PerceptionReason,
  PerceptionSentiment,
} from "@/lib/supabase/types";
import type { Report, ReportCategory, ReportStatus } from "@/lib/types";

type AdminAccess = "loading" | "allowed" | "denied";
type PhotoPopupMode = "complete" | "replace";

async function fetchReports(): Promise<Report[]> {
  const response = await fetch("/api/laporan");
  if (!response.ok) throw new Error("Gagal memuat laporan admin");
  return response.json();
}

async function fetchDeletionLogs(): Promise<DeletionLogRow[]> {
  const response = await fetch("/api/admin/deletion-logs");
  if (!response.ok) throw new Error("Gagal memuat log penghapusan");
  return response.json();
}

/** Baris persepsi dari GET /api/persepsi (tanpa user_id demi privasi). */
interface PersepsiRow {
  id: string;
  latitude: number;
  longitude: number;
  sentiment: PerceptionSentiment;
  reason: PerceptionReason | null;
  report_id: string | null;
  created_at: string;
}

async function fetchPersepsi(): Promise<PersepsiRow[]> {
  const response = await fetch("/api/persepsi?days=30");
  if (!response.ok) throw new Error("Gagal memuat data persepsi");
  return response.json();
}

// Status yang bisa di-set langsung oleh admin (tanpa foto)
const ADMIN_SELECTABLE: ReportStatus[] = ["dilaporkan", "diproses"];

/** Format koordinat dengan presisi konsisten (5 desimal). */
function formatCoord(value: number): string {
  return value.toFixed(5);
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [access, setAccess] = useState<AdminAccess>("loading");
  const [adminEmail, setAdminEmail] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ReportCategory | "all">("all");
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // State popup upload foto selesai / ganti foto
  const [photoTarget, setPhotoTarget] = useState<Report | null>(null);
  const [photoMode, setPhotoMode] = useState<PhotoPopupMode>("complete");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State popup hapus laporan
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    let active = true;
    createClient().auth.getUser().then(({ data }) => {
      if (!active) return;
      const allowed = data.user?.user_metadata?.role === "admin";
      setAccess(allowed ? "allowed" : "denied");
      setAdminEmail(data.user?.email ?? "Admin SigapKota");
    });
    return () => { active = false; };
  }, []);

  const { data: reports = [], isLoading, isError, refetch } = useQuery<Report[]>({
    queryKey: ["admin_reports"],
    queryFn: fetchReports,
    enabled: access === "allowed",
  });

  const {
    data: deletionLogs = [],
    isLoading: logsLoading,
    isError: logsError,
    refetch: refetchLogs,
  } = useQuery<DeletionLogRow[]>({
    queryKey: ["deletion_logs"],
    queryFn: fetchDeletionLogs,
    enabled: access === "allowed",
  });

  const {
    data: persepsi = [],
    isLoading: persepsiLoading,
    isError: persepsiError,
  } = useQuery<PersepsiRow[]>({
    queryKey: ["persepsi", "admin"],
    queryFn: fetchPersepsi,
    enabled: access === "allowed",
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: ReportStatus }) => {
      const response = await fetch(`/api/laporan/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Gagal memperbarui status");
      }
      return response.json();
    },
    onMutate: ({ id }) => setUpdatingId(id),
    onSuccess: () => {
      toast.success("Status laporan diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["admin_reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setUpdatingId(null),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ report, file, mode }: { report: Report; file: File; mode: PhotoPopupMode }) => {
      const form = new FormData();
      form.append("photo_after", file);
      const endpoint = mode === "replace" ? `/api/laporan/${report.id}/foto-after` : `/api/laporan/${report.id}`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        body: form,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Gagal mengupload foto");
      }
      return response.json();
    },
    onMutate: ({ report }) => setUpdatingId(report.id),
    onSuccess: (_data, { mode }) => {
      toast.success(mode === "replace" ? "Foto sesudah berhasil diganti." : "Foto berhasil diupload. Menunggu konfirmasi pelapor.");
      queryClient.invalidateQueries({ queryKey: ["admin_reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      closePhotoPopup();
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setUpdatingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/laporan/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Gagal menghapus laporan");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Laporan dihapus. Penghapusan tercatat di log.");
      queryClient.invalidateQueries({ queryKey: ["admin_reports"] });
      queryClient.invalidateQueries({ queryKey: ["deletion_logs"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      closeDeletePopup();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const stats = useMemo(() => {
    const byStatus: Record<ReportStatus, number> = { dilaporkan: 0, diproses: 0, menunggu_konfirmasi: 0, selesai: 0 };
    const byCategory: Record<ReportCategory, number> = { jalan_rusak: 0, sampah: 0, banjir: 0, fasilitas_umum: 0, lainnya: 0 };
    for (const report of reports) {
      byStatus[report.status] += 1;
      byCategory[report.category] += 1;
    }
    return { total: reports.length, byStatus, byCategory };
  }, [reports]);

  // Agregat persepsi warga 30 hari terakhir (Unseen Insight).
  const persepsiStats = useMemo(() => {
    const bySentiment: Record<PerceptionSentiment, number> = {
      nyaman: 0,
      biasa: 0,
      tidak_nyaman: 0,
    };
    const byReason = new Map<PerceptionReason, number>();
    for (const item of persepsi) {
      bySentiment[item.sentiment] += 1;
      if (item.reason) {
        byReason.set(item.reason, (byReason.get(item.reason) ?? 0) + 1);
      }
    }

    let topReason: PerceptionReason | null = null;
    let topReasonCount = 0;
    for (const reason of PERCEPTION_REASONS) {
      const count = byReason.get(reason) ?? 0;
      if (count > topReasonCount) {
        topReason = reason;
        topReasonCount = count;
      }
    }

    const rankedReasons = PERCEPTION_REASONS.map((reason) => ({
      reason,
      count: byReason.get(reason) ?? 0,
    }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total: persepsi.length,
      bySentiment,
      topReason,
      topReasonCount,
      rankedReasons,
    };
  }, [persepsi]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    return reports.filter((report) => {
      const matchesQuery = !query || `${report.id} ${report.title}`.toLocaleLowerCase("id-ID").includes(query);
      return matchesQuery && (category === "all" || report.category === category) && (status === "all" || report.status === status);
    });
  }, [category, reports, search, status]);

  const maxCategoryValue = Math.max(...Object.values(stats.byCategory), 0);
  const topCategory: ReportCategory | null =
    maxCategoryValue > 0
      ? REPORT_CATEGORIES.reduce(
          (best, item) => (stats.byCategory[item] > stats.byCategory[best] ? item : best),
          REPORT_CATEGORIES[0],
        )
      : null;

  function exportReports() {
    const rows = [
      ["ID", "Judul", "Kategori", "Status", "Dukungan", "Latitude", "Longitude"],
      ...filtered.map((report) => [report.id, report.title, CATEGORY_LABELS[report.category], STATUS_LABELS[report.status], report.vote_count, report.latitude, report.longitude]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "laporan-sigapkota.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleStatusChange(report: Report, nextStatus: ReportStatus) {
    // Jika admin pilih selesai, buka popup upload foto
    if (nextStatus === "selesai" || nextStatus === "menunggu_konfirmasi") {
      setPhotoTarget(report);
      return;
    }
    if (ADMIN_SELECTABLE.includes(nextStatus)) {
      statusMutation.mutate({ id: report.id, nextStatus });
    }
  }

  function closePhotoPopup() {
    setPhotoTarget(null);
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  }

  function openReplacePhotoPopup(report: Report) {
    setPhotoMode("replace");
    setPhotoTarget(report);
  }

  function closeDeletePopup() {
    setDeleteTarget(null);
    setDeleteReason("");
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
  }

  const statCards = [
    {
      label: "Total",
      value: stats.total,
      note: "Seluruh laporan tercatat",
      icon: FileText,
      iconClass: "bg-primary/10 text-primary",
    },
    {
      label: "Menunggu",
      value: stats.byStatus.dilaporkan,
      note: "Belum ditindaklanjuti",
      icon: ClipboardClock,
      iconClass: "bg-surface-container text-on-surface-variant",
    },
    {
      label: "Aktif",
      value: stats.byStatus.diproses,
      note: "Sedang dalam penanganan",
      icon: RefreshCw,
      iconClass: "bg-secondary/10 text-secondary",
    },
    {
      label: "Selesai",
      value: stats.byStatus.selesai,
      note: "Ditutup dan dikonfirmasi",
      icon: CheckCircle2,
      iconClass: "bg-tertiary/10 text-tertiary",
    },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-outline-variant/30 bg-surface-lowest lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-outline-variant/25 px-5">
          <CivicBrandMark className="h-10 w-10" />
          <div className="font-heading text-xl font-bold">SigapKota <span className="text-secondary">Admin</span></div>
        </div>
        <nav className="flex-1 p-4" aria-label="Navigasi admin">
          <div className="flex h-12 items-center gap-3 rounded-xl bg-primary/10 px-4 text-sm font-medium text-primary">
            <FileText className="h-5 w-5" />Manajemen Laporan
          </div>
        </nav>
        <div className="flex items-center gap-3 border-t border-outline-variant/25 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><UserRound className="h-5 w-5" /></span>
          <div className="min-w-0"><p className="text-sm font-semibold">Admin</p><p className="truncate text-xs text-outline" title={adminEmail}>{adminEmail || "Administrator"}</p></div>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant/25 bg-surface/96 px-4 shadow-sm backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Buka navigasi admin" className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors duration-150 ease-out hover:bg-surface-container active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"><Menu className="h-5 w-5" /></button>
            <h1 className="font-heading text-xl font-bold">Manajemen Laporan</h1>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative hidden sm:block">
              <span className="sr-only">Cari laporan</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari laporan..." className="h-11 w-72 rounded-xl bg-surface-lowest pl-9" />
            </label>
            <Link href="/" aria-label="Buka peta publik" className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors duration-150 ease-out hover:bg-surface-container hover:text-primary active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Layers3 className="h-5 w-5" /></Link>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {access === "loading" || isLoading ? (
            <div className="space-y-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-44 rounded-xl" />)}</div><Skeleton className="h-96 rounded-xl" /></div>
          ) : access === "denied" ? (
            <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center text-center"><Lock className="mb-4 h-12 w-12 text-outline" /><h2 className="font-heading text-2xl font-semibold">Akses ditolak</h2><p className="mt-2 text-sm text-outline">Halaman ini hanya dapat diakses oleh administrator SigapKota.</p><Link href="/" className="mt-5"><Button variant="outline">Kembali ke beranda</Button></Link></div>
          ) : isError ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center"><AlertCircle className="mb-3 h-11 w-11 text-destructive" /><h2 className="font-heading text-xl font-semibold">Gagal memuat data admin</h2><Button variant="outline" className="mt-4" onClick={() => refetch()}>Coba lagi</Button></div>
          ) : (
            <div className="space-y-6">
              {/* Ringkasan status */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <section
                      key={item.label}
                      className={`anim-fade-up anim-delay-${index + 1} rounded-xl border border-outline-variant/25 bg-surface-lowest p-5 shadow-[0_2px_12px_rgba(0,109,119,0.05)]`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.iconClass}`}>
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <h2 className="font-heading text-sm font-semibold text-on-surface-variant">{item.label}</h2>
                      </div>
                      <p className="mt-4 font-heading text-4xl font-bold tracking-tight text-on-surface tabular-nums">
                        {item.value.toLocaleString("id-ID")}
                      </p>
                      <p className="mt-1 text-xs text-outline">{item.note}</p>
                    </section>
                  );
                })}
              </div>

              {/* Distribusi kategori */}
              <section className="anim-fade-up anim-delay-5 rounded-xl border border-outline-variant/25 bg-surface-lowest p-5 shadow-[0_2px_12px_rgba(0,109,119,0.05)] sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-xl font-semibold text-on-surface">Laporan berdasarkan kategori</h2>
                    <p className="mt-1 text-xs text-outline">Sebaran {stats.total.toLocaleString("id-ID")} laporan di seluruh kategori.</p>
                  </div>
                  {topCategory && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                      <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden="true" />
                      Terbanyak: {CATEGORY_LABELS[topCategory]}
                    </span>
                  )}
                </div>
                <div className="mt-6 grid grid-cols-5 gap-3 sm:gap-5">
                  {REPORT_CATEGORIES.map((item) => {
                    const value = stats.byCategory[item];
                    const isTop = item === topCategory;
                    return (
                      <div key={item} className="flex min-w-0 flex-col items-center">
                        <div className="flex h-48 w-full flex-col items-center justify-end gap-1.5 border-b border-outline-variant/35">
                          <span className={`text-xs font-bold tabular-nums ${isTop ? "text-secondary" : "text-on-surface-variant"}`}>
                            {value.toLocaleString("id-ID")}
                          </span>
                          {value > 0 ? (
                            <div
                              className={`w-full max-w-16 rounded-t-md ${isTop ? "bg-secondary" : "bg-primary"}`}
                              style={{ height: `${Math.max(6, Math.round((value / maxCategoryValue) * 100))}%` }}
                              role="img"
                              aria-label={`${CATEGORY_LABELS[item]}: ${value} laporan`}
                            />
                          ) : (
                            <div className="mb-1 h-0.5 w-6 rounded-full bg-outline-variant/60" aria-hidden="true" />
                          )}
                        </div>
                        <span className="mt-2 max-w-full truncate text-xs text-outline" title={`${CATEGORY_LABELS[item]} (${value})`}>
                          {CATEGORY_LABELS[item]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Unseen Insight (persepsi warga) */}
              <section className="anim-fade-up anim-delay-6 rounded-xl border border-outline-variant/25 bg-surface-lowest p-5 shadow-[0_2px_12px_rgba(0,109,119,0.05)] sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-xl font-semibold text-on-surface">Unseen Insight</h2>
                    <p className="mt-1 text-xs text-outline">Apa yang dirasakan warga berdasarkan persepsi 30 hari terakhir</p>
                  </div>
                  {persepsiStats.total > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      {persepsiStats.total.toLocaleString("id-ID")} persepsi
                    </span>
                  )}
                </div>

                {persepsiLoading ? (
                  <div className="mt-6 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-xl" />)}</div>
                    <Skeleton className="h-32 rounded-xl" />
                  </div>
                ) : persepsiError ? (
                  <p className="mt-6 text-sm text-outline">Gagal memuat data persepsi.</p>
                ) : persepsiStats.total === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Eye className="h-8 w-8 text-outline" aria-hidden="true" />
                    <p className="text-sm font-medium text-on-surface">Belum ada persepsi warga.</p>
                    <p className="text-xs text-outline">Persepsi akan tampil di sini setelah warga mulai berbagi.</p>
                  </div>
                ) : (
                  <>
                    {/* Stat ringkas */}
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          label: "Total Persepsi",
                          value: persepsiStats.total.toLocaleString("id-ID"),
                        },
                        {
                          label: "% Nyaman",
                          value:
                            persepsiStats.total >= 5
                              ? `${Math.round((persepsiStats.bySentiment.nyaman / persepsiStats.total) * 100)}%`
                              : "-",
                        },
                        {
                          label: "% Tidak Nyaman",
                          value:
                            persepsiStats.total >= 5
                              ? `${Math.round((persepsiStats.bySentiment.tidak_nyaman / persepsiStats.total) * 100)}%`
                              : "-",
                        },
                        {
                          label: "Alasan Teratas",
                          value: persepsiStats.topReason
                            ? PERCEPTION_REASON_LABELS[persepsiStats.topReason]
                            : "-",
                        },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-outline-variant/25 bg-surface-low px-4 py-3">
                          <p className="text-xs font-medium text-outline">{item.label}</p>
                          <p className="mt-1 truncate font-heading text-2xl font-bold tracking-tight text-on-surface tabular-nums" title={item.value}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {persepsiStats.total < 5 && (
                      <p className="mt-3 text-xs text-outline">Belum cukup respons untuk melihat pola.</p>
                    )}

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                      {/* Rincian sentimen */}
                      <div>
                        <h3 className="font-heading text-sm font-semibold text-on-surface-variant">Rincian sentimen</h3>
                        <div className="mt-3 space-y-3">
                          {PERCEPTION_SENTIMENTS.map((sentiment) => {
                            const count = persepsiStats.bySentiment[sentiment];
                            const share = Math.round((count / persepsiStats.total) * 100);
                            const enoughSample = persepsiStats.total >= 5;
                            return (
                              <div key={sentiment}>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-on-surface">{PERCEPTION_SENTIMENT_LABELS[sentiment].label}</span>
                                  <span className="tabular-nums text-outline">{enoughSample ? `${share}% ` : ""}({count.toLocaleString("id-ID")})</span>
                                </div>
                                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-container">
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{ width: `${Math.max(count > 0 ? 4 : 0, share)}%`, backgroundColor: PERCEPTION_SENTIMENT_COLORS[sentiment] }}
                                    role="img"
                                    aria-label={`${PERCEPTION_SENTIMENT_LABELS[sentiment].label}: ${count} persepsi (${share}%)`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Alasan teratas */}
                      <div>
                        <h3 className="font-heading text-sm font-semibold text-on-surface-variant">Alasan paling sering disebut</h3>
                        {persepsiStats.rankedReasons.length === 0 ? (
                          <p className="mt-3 text-sm text-outline">-</p>
                        ) : (
                          <ol className="mt-3 space-y-2">
                            {persepsiStats.rankedReasons.map((entry, index) => (
                              <li key={entry.reason} className="flex items-center justify-between rounded-lg border border-outline-variant/20 bg-surface-low px-3 py-2 text-sm">
                                <span className="flex min-w-0 items-center gap-2">
                                  <span className="w-4 shrink-0 text-xs font-bold tabular-nums text-outline">{index + 1}</span>
                                  <span className="truncate text-on-surface">{PERCEPTION_REASON_LABELS[entry.reason]}</span>
                                </span>
                                <span className="ml-2 shrink-0 text-xs font-bold tabular-nums text-on-surface-variant">{entry.count.toLocaleString("id-ID")}</span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </div>

                    <p className="mt-6 border-t border-outline-variant/20 pt-3 text-xs text-outline">Data persepsi bersifat agregat dan anonim.</p>
                  </>
                )}
              </section>

              {/* Direktori laporan */}
              <section className="anim-fade-up anim-delay-6 overflow-hidden rounded-xl border border-outline-variant/25 bg-surface-lowest shadow-[0_2px_12px_rgba(0,109,119,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 p-5 sm:p-6">
                  <div>
                    <h2 className="font-heading text-xl font-semibold text-on-surface">Direktori laporan aktif</h2>
                    <p className="mt-1 text-xs text-outline">Kelola status, foto penanganan, dan data {reports.length.toLocaleString("id-ID")} laporan.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setFiltersOpen((open) => !open)} className="h-11 gap-2"><SlidersHorizontal className="h-4 w-4" />Filter</Button>
                    <Button variant="secondary" onClick={exportReports} className="h-11 gap-2"><Download className="h-4 w-4" />Ekspor</Button>
                  </div>
                </div>
                {filtersOpen && (
                  <div className="anim-scale-in grid gap-3 border-b border-outline-variant/30 bg-surface-low p-4 sm:grid-cols-3">
                    <div className="relative sm:hidden"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari laporan..." className="h-11 pl-9" /></div>
                    <Select value={category} onValueChange={(value) => setCategory(value as ReportCategory | "all")}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua kategori</SelectItem>{REPORT_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{CATEGORY_LABELS[item]}</SelectItem>)}</SelectContent></Select>
                    <Select value={status} onValueChange={(value) => setStatus(value as ReportStatus | "all")}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua status</SelectItem>{REPORT_STATUSES.map((item) => <SelectItem key={item} value={item}>{STATUS_LABELS[item]}</SelectItem>)}</SelectContent></Select>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-outline-variant/30 bg-surface-low text-xs font-bold uppercase tracking-wider text-outline">
                        <th className="px-4 py-3 font-bold">Foto</th>
                        <th className="px-4 py-3 font-bold">Detail laporan</th>
                        <th className="px-4 py-3 font-bold">Lokasi</th>
                        <th className="px-4 py-3 font-bold">Status</th>
                        <th className="px-4 py-3 text-center font-bold">Dukungan</th>
                        <th className="px-4 py-3 text-right font-bold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/25">
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center">
                            <Search className="mx-auto mb-3 h-8 w-8 text-outline" aria-hidden="true" />
                            <p className="text-sm font-medium text-on-surface">Tidak ada laporan yang cocok</p>
                            <p className="mt-1 text-xs text-outline">Ubah kata kunci pencarian atau reset filter.</p>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((report) => {
                          const meta = STATUS_META[report.status];
                          const lockedStatus = report.status === "menunggu_konfirmasi" || report.status === "selesai";
                          return (
                            <tr key={report.id} className="transition-colors duration-150 ease-out hover:bg-surface-low/70">
                              <td className="px-4 py-3">
                                {report.photo_url ? (
                                  <div className="h-12 w-12 overflow-hidden rounded-lg border border-outline-variant/20">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={report.photo_url} alt="" className="h-full w-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container text-outline"><ImageOff className="h-5 w-5" aria-hidden="true" /></div>
                                )}
                              </td>
                              <td className="max-w-xs px-4 py-3">
                                <Link href={`/laporan/${report.id}`} className="block truncate text-sm font-medium text-on-surface transition-colors duration-150 ease-out hover:text-primary">
                                  {report.title}
                                </Link>
                                <div className="mt-1 flex items-center gap-2 text-xs text-outline">
                                  <span className="rounded-full bg-tertiary/10 px-2 py-0.5 font-medium text-tertiary">{CATEGORY_LABELS[report.category]}</span>
                                  <span>{new Date(report.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <p className="text-sm tabular-nums text-on-surface-variant">{formatCoord(report.latitude)}, {formatCoord(report.longitude)}</p>
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-outline"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />Koordinat pelapor</p>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {/* Laporan menunggu_konfirmasi tidak bisa diubah oleh admin sampai user konfirmasi */}
                                  {lockedStatus ? (
                                    <span className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-medium ${meta.pillClassName}`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClassName}`} aria-hidden="true" />
                                      {meta.label}
                                    </span>
                                  ) : (
                                    <Select
                                      value={report.status}
                                      disabled={updatingId === report.id}
                                      onValueChange={(value) => handleStatusChange(report, value as ReportStatus)}
                                    >
                                      <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {ADMIN_SELECTABLE.map((item) => (
                                          <SelectItem key={item} value={item}>{STATUS_LABELS[item]}</SelectItem>
                                        ))}
                                        <SelectItem value="selesai">Tandai Selesai...</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                  {updatingId === report.id && <Loader2 className="h-4 w-4 animate-spin text-outline" aria-label="Memperbarui" />}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center"><span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums"><ThumbsUp className="h-4 w-4 text-secondary" aria-hidden="true" />{(report.vote_count ?? 0).toLocaleString("id-ID")}</span></td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Link
                                    href={`/laporan/${report.id}`}
                                    className="mr-1 inline-flex h-9 items-center rounded-lg px-3 text-xs font-medium text-primary transition-colors duration-150 ease-out hover:bg-primary/10"
                                  >
                                    Lihat detail
                                  </Link>
                                  {(report.status === "menunggu_konfirmasi" || report.status === "selesai") && (
                                    <button
                                      type="button"
                                      onClick={() => openReplacePhotoPopup(report)}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-all duration-150 ease-out hover:bg-surface-container hover:text-primary active:scale-[0.95]"
                                      aria-label={`Ganti foto sesudah untuk laporan ${report.title}`}
                                      title="Ganti foto sesudah"
                                    >
                                      <ImagePlus className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(report)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-outline transition-all duration-150 ease-out hover:bg-destructive/10 hover:text-destructive active:scale-[0.95]"
                                    aria-label={`Hapus laporan ${report.title}`}
                                    title="Hapus laporan"
                                  >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-outline-variant/30 bg-surface px-5 py-4 text-xs text-outline"><span>Menampilkan {filtered.length.toLocaleString("id-ID")} dari {reports.length.toLocaleString("id-ID")} laporan</span></div>
              </section>

              {/* Log hapus laporan */}
              <section className="anim-fade-in overflow-hidden rounded-xl border border-outline-variant/25 bg-surface-lowest shadow-[0_2px_12px_rgba(0,109,119,0.05)]">
                <div className="flex items-center justify-between border-b border-outline-variant/30 p-5 sm:p-6">
                  <div>
                    <h2 className="font-heading text-xl font-semibold text-on-surface">Log Hapus Laporan</h2>
                    <p className="mt-1 text-xs text-outline">Riwayat 50 penghapusan terakhir beserta alasannya.</p>
                  </div>
                  <Button variant="outline" onClick={() => refetchLogs()} className="h-11 gap-2"><RefreshCw className="h-4 w-4" />Segarkan</Button>
                </div>
                {logsLoading ? (
                  <div className="space-y-3 p-5 sm:p-6">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-lg" />)}</div>
                ) : logsError ? (
                  <div className="flex flex-col items-center gap-3 p-8 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
                    <p className="text-sm text-on-surface-variant">Gagal memuat log penghapusan.</p>
                    <Button variant="outline" onClick={() => refetchLogs()}>Coba lagi</Button>
                  </div>
                ) : deletionLogs.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 p-10 text-center">
                    <History className="h-8 w-8 text-outline" aria-hidden="true" />
                    <p className="text-sm font-medium">Belum ada laporan yang dihapus</p>
                    <p className="text-xs text-outline">Log penghapusan akan tampil di sini.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-outline-variant/30 bg-surface-low text-xs font-bold uppercase tracking-wider text-outline">
                          <th className="px-4 py-3 font-bold">Waktu</th>
                          <th className="px-4 py-3 font-bold">Laporan</th>
                          <th className="px-4 py-3 font-bold">Kategori</th>
                          <th className="px-4 py-3 font-bold">Alasan</th>
                          <th className="px-4 py-3 font-bold">Dihapus oleh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/25">
                        {deletionLogs.map((log) => {
                          const categoryLabel = log.category && log.category in CATEGORY_LABELS ? CATEGORY_LABELS[log.category as ReportCategory] : "Lainnya";
                          return (
                            <tr key={log.id} className="transition-colors duration-150 ease-out hover:bg-surface-low/70">
                              <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-outline">{log.created_at ? new Date(log.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                              <td className="max-w-xs px-4 py-3"><p className="truncate text-sm font-medium">{log.title ?? "-"}</p><p className="mt-0.5 truncate text-xs text-outline" title={log.report_id}>{log.report_id}</p></td>
                              <td className="px-4 py-3"><span className="rounded-full bg-tertiary/10 px-2 py-0.5 text-xs font-medium text-tertiary">{categoryLabel}</span></td>
                              <td className="max-w-sm px-4 py-3"><p className="line-clamp-2 text-sm text-on-surface-variant" title={log.reason ?? ""}>{log.reason ?? "-"}</p></td>
                              <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${log.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary-container/20 text-secondary"}`}>{log.role === "admin" ? "Admin" : "Pengguna"}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Dialog upload / ganti foto sesudah */}
      <Dialog
        open={photoTarget !== null}
        onOpenChange={(open) => {
          if (!open) closePhotoPopup();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {photoMode === "replace" ? "Ganti Foto Sesudah" : "Upload Foto Bukti Penyelesaian"}
            </DialogTitle>
            <DialogDescription>
              {photoMode === "replace" ? (
                <>
                  Ganti foto sesudah untuk laporan{" "}
                  <span className="font-semibold text-on-surface">&ldquo;{photoTarget?.title}&rdquo;</span>. Status
                  laporan tidak akan berubah.
                </>
              ) : (
                <>
                  Upload foto bukti penanganan untuk laporan{" "}
                  <span className="font-semibold text-on-surface">&ldquo;{photoTarget?.title}&rdquo;</span>. Setelah
                  diupload, pelapor akan diminta mengkonfirmasi bahwa masalah benar-benar sudah selesai.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-outline-variant/50 bg-surface-low p-8 text-center transition-colors duration-150 ease-out hover:border-primary/50 hover:bg-primary/5"
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Preview" className="max-h-48 rounded-lg object-contain" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-outline" aria-hidden="true" />
                <span className="text-sm text-outline">Klik untuk pilih foto</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileSelect}
          />

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={closePhotoPopup} disabled={uploadMutation.isPending}>
              Batal
            </Button>
            <Button
              className="flex-1"
              disabled={!photoFile || uploadMutation.isPending}
              onClick={() => {
                if (photoTarget && photoFile) uploadMutation.mutate({ report: photoTarget, file: photoFile, mode: photoMode });
              }}
            >
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : photoMode === "replace" ? "Simpan Foto" : "Kirim & Minta Konfirmasi"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog hapus laporan */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) closeDeletePopup();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Laporan</DialogTitle>
            <DialogDescription>
              Laporan <span className="font-semibold text-on-surface">&ldquo;{deleteTarget?.title}&rdquo;</span> akan
              dihapus permanen. Alasan penghapusan wajib diisi dan akan tercatat di log.
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={deleteReason}
            onChange={(event) => setDeleteReason(event.target.value)}
            placeholder="Tuliskan alasan penghapusan..."
            rows={3}
            aria-label="Alasan penghapusan"
            className="w-full resize-none rounded-xl border border-outline-variant/40 bg-surface-low px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-outline focus:border-primary"
          />

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={closeDeletePopup} disabled={deleteMutation.isPending}>
              Batal
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={!deleteReason.trim() || deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate({ id: deleteTarget.id, reason: deleteReason.trim() });
              }}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hapus Permanen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
