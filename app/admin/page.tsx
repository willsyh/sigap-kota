"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ClipboardClock,
  Download,
  FileText,
  ImageOff,
  LayoutDashboard,
  Layers3,
  Loader2,
  Lock,
  MapPin,
  Menu,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  ThumbsUp,
  UserRound,
} from "lucide-react";

import CivicBrandMark from "@/components/CivicBrandMark";
import { Button } from "@/components/ui/button";
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
} from "@/lib/constants/reports";
import { createClient } from "@/lib/supabase/client";
import type { Report, ReportCategory, ReportStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type AdminAccess = "loading" | "allowed" | "denied";
type AdminSection = "overview" | "reports" | "analytics" | "settings";

async function fetchReports(): Promise<Report[]> {
  const response = await fetch("/api/laporan");
  if (!response.ok) throw new Error("Gagal memuat laporan admin");
  return response.json();
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [access, setAccess] = useState<AdminAccess>("loading");
  const [adminEmail, setAdminEmail] = useState("");
  const [section, setSection] = useState<AdminSection>("reports");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ReportCategory | "all">("all");
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const stats = useMemo(() => {
    const byStatus: Record<ReportStatus, number> = { dilaporkan: 0, diproses: 0, selesai: 0 };
    const byCategory: Record<ReportCategory, number> = { jalan_rusak: 0, sampah: 0, banjir: 0, fasilitas_umum: 0, lainnya: 0 };
    for (const report of reports) {
      byStatus[report.status] += 1;
      byCategory[report.category] += 1;
    }
    return { total: reports.length, byStatus, byCategory };
  }, [reports]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    return reports.filter((report) => {
      const matchesQuery = !query || `${report.id} ${report.title}`.toLocaleLowerCase("id-ID").includes(query);
      return matchesQuery && (category === "all" || report.category === category) && (status === "all" || report.status === status);
    });
  }, [category, reports, search, status]);

  const maxCategory = Math.max(...Object.values(stats.byCategory), 1);
  const priorityReports = reports.filter((report) => report.status !== "selesai" && report.vote_count >= 10);

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

  const navItems: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
    { id: "reports", label: "Semua Laporan", icon: FileText },
    { id: "analytics", label: "Analitik", icon: BarChart3 },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-outline-variant/30 bg-surface-lowest lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-outline-variant/25 px-5">
          <CivicBrandMark className="h-10 w-10" />
          <div className="font-heading text-xl font-bold">SigapKota <span className="text-secondary">Admin</span></div>
        </div>
        <nav className="flex-1 space-y-2 p-4" aria-label="Navigasi admin">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" onClick={() => setSection(item.id)} className={cn("flex h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", section === item.id ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-container")}>
                <Icon className="h-5 w-5" />{item.label}
              </button>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 border-t border-outline-variant/25 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><UserRound className="h-5 w-5" /></span>
          <div className="min-w-0"><p className="text-sm font-semibold">Admin</p><p className="truncate text-xs text-outline" title={adminEmail}>{adminEmail || "Administrator"}</p></div>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant/25 bg-surface/96 px-4 shadow-sm backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Buka navigasi admin" className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container lg:hidden"><Menu className="h-5 w-5" /></button>
            <h1 className="font-heading text-xl font-bold">Manajemen Laporan</h1>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative hidden sm:block">
              <span className="sr-only">Cari laporan</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari laporan..." className="h-11 w-72 rounded-xl bg-surface-lowest pl-9" />
            </label>
            <Link href="/" aria-label="Buka peta publik" className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-primary"><Layers3 className="h-5 w-5" /></Link>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {access === "loading" || isLoading ? (
            <div className="space-y-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-xl" />)}</div><Skeleton className="h-96 rounded-xl" /></div>
          ) : access === "denied" ? (
            <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center text-center"><Lock className="mb-4 h-12 w-12 text-outline" /><h2 className="font-heading text-2xl font-semibold">Akses ditolak</h2><p className="mt-2 text-sm text-outline">Halaman ini hanya dapat diakses oleh administrator SigapKota.</p><Link href="/" className="mt-5"><Button variant="outline">Kembali ke beranda</Button></Link></div>
          ) : isError ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center"><AlertCircle className="mb-3 h-11 w-11 text-destructive" /><h2 className="font-heading text-xl font-semibold">Gagal memuat data admin</h2><Button variant="outline" className="mt-4" onClick={() => refetch()}>Coba lagi</Button></div>
          ) : section === "settings" ? (
            <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-6 shadow-sm"><h2 className="font-heading text-xl font-semibold">Pengaturan</h2><p className="mt-2 text-sm text-outline">Konfigurasi sistem dikelola melalui environment dan dashboard Supabase.</p></div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Total", value: stats.total, note: "Seluruh laporan", icon: FileText, tone: "text-primary bg-surface-highest/80 border-outline-variant/25" },
                  { label: "Menunggu", value: stats.byStatus.dilaporkan, note: "Perlu ditinjau", icon: ClipboardClock, tone: "text-secondary bg-secondary-container/15 border-secondary/25" },
                  { label: "Aktif", value: stats.byStatus.diproses, note: "Sedang ditangani", icon: RefreshCw, tone: "text-primary bg-primary/10 border-primary/25" },
                  { label: "Selesai", value: stats.byStatus.selesai, note: "Ditutup berhasil", icon: CheckCircle2, tone: "text-tertiary bg-tertiary/10 border-tertiary/25" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <section key={item.label} className={`rounded-xl border bg-surface-lowest p-6 shadow-[0_2px_12px_rgba(0,109,119,0.05)] ${item.tone.split(" ").at(-1)}`}>
                      <div className="mb-5 flex items-start justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-full ${item.tone.split(" ").slice(0, 2).join(" ")}`}><Icon className="h-5 w-5" /></span><span className="text-xs font-bold uppercase tracking-wider text-outline">{item.label}</span></div>
                      <p className="font-heading text-4xl font-bold tracking-tight">{item.value.toLocaleString("id-ID")}</p><p className="mt-2 text-xs text-outline">{item.note}</p>
                    </section>
                  );
                })}
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <section className="rounded-xl border border-outline-variant/25 bg-surface-lowest p-6 shadow-[0_2px_12px_rgba(0,109,119,0.05)] xl:col-span-2">
                  <h2 className="font-heading text-xl font-semibold">Laporan berdasarkan kategori</h2>
                  <div className="mt-8 flex h-56 items-end gap-4 border-b border-outline-variant/35 px-2 pb-4">
                    {REPORT_CATEGORIES.map((item, index) => {
                      const colors = ["bg-primary", "bg-secondary", "bg-tertiary", "bg-surface-dim", "bg-outline-variant"];
                      const value = stats.byCategory[item];
                      return (
                        <div key={item} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                          <span className="text-xs font-semibold text-outline">{value}</span>
                          <div className={`w-full max-w-24 rounded-t ${colors[index]}`} style={{ height: `${Math.max(6, (value / maxCategory) * 75)}%` }} />
                          <span className="w-full truncate text-center text-[10px] text-outline" title={CATEGORY_LABELS[item]}>{CATEGORY_LABELS[item]}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="flex flex-col justify-between overflow-hidden rounded-xl bg-primary p-6 text-primary-foreground shadow-lg">
                  <div><h2 className="font-heading text-2xl font-semibold">Perlu Perhatian</h2><p className="mt-2 text-sm leading-5 text-primary-foreground/75">Ada {priorityReports.length} laporan prioritas tinggi yang menunggu penanganan.</p><div className="mt-6 space-y-3"><div className="flex items-center justify-between rounded-lg bg-black/10 p-3 text-sm font-semibold"><span>Laporan kritis</span><span className="rounded-full bg-destructive px-2 py-1 text-xs text-white">{priorityReports.filter((item) => item.vote_count >= 25).length}</span></div><div className="flex items-center justify-between rounded-lg bg-black/10 p-3 text-sm font-semibold"><span>Antrean aktif</span><span className="rounded-full bg-secondary px-2 py-1 text-xs text-white">{priorityReports.length}</span></div></div></div>
                  <button type="button" onClick={() => { setStatus("dilaporkan"); setSection("reports"); }} className="mt-7 h-12 cursor-pointer rounded-lg bg-white font-semibold text-primary transition-colors hover:bg-surface">Tinjau antrean prioritas</button>
                </section>
              </div>

              <section className="overflow-hidden rounded-xl border border-outline-variant/25 bg-surface-lowest shadow-[0_2px_12px_rgba(0,109,119,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 p-5 sm:p-6"><h2 className="font-heading text-xl font-semibold">Direktori laporan aktif</h2><div className="flex gap-2"><Button variant="outline" onClick={() => setFiltersOpen((open) => !open)} className="h-11 gap-2"><SlidersHorizontal className="h-4 w-4" />Filter</Button><Button variant="secondary" onClick={exportReports} className="h-11 gap-2"><Download className="h-4 w-4" />Ekspor</Button></div></div>
                {filtersOpen && (
                  <div className="grid gap-3 border-b border-outline-variant/30 bg-surface-low p-4 sm:grid-cols-3">
                    <div className="relative sm:hidden"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari laporan..." className="h-11 pl-9" /></div>
                    <Select value={category} onValueChange={(value) => setCategory(value as ReportCategory | "all")}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua kategori</SelectItem>{REPORT_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{CATEGORY_LABELS[item]}</SelectItem>)}</SelectContent></Select>
                    <Select value={status} onValueChange={(value) => setStatus(value as ReportStatus | "all")}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua status</SelectItem>{REPORT_STATUSES.map((item) => <SelectItem key={item} value={item}>{STATUS_LABELS[item]}</SelectItem>)}</SelectContent></Select>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] border-collapse text-left">
                    <thead><tr className="border-b border-outline-variant/30 bg-surface-low text-xs font-bold uppercase tracking-wider text-outline"><th className="p-4">Foto</th><th className="p-4">Detail laporan</th><th className="p-4">Lokasi</th><th className="p-4">Status</th><th className="p-4 text-center">Dukungan</th><th className="p-4 text-right">Aksi</th></tr></thead>
                    <tbody className="divide-y divide-outline-variant/25">
                      {filtered.map((report) => (
                        <tr key={report.id} className="transition-colors hover:bg-surface-low/70">
                          <td className="p-4">{report.photo_url ? <div className="h-12 w-12 overflow-hidden rounded-lg border border-outline-variant/20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={report.photo_url} alt="" className="h-full w-full object-cover" />
                          </div> : <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container text-outline"><ImageOff className="h-5 w-5" /></div>}</td>
                          <td className="max-w-xs p-4"><p className="truncate text-sm font-medium">{report.title}</p><div className="mt-1 flex items-center gap-2"><span className="rounded bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-variant">{CATEGORY_LABELS[report.category]}</span><span className="text-[10px] text-outline">{new Date(report.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span></div></td>
                          <td className="p-4"><p className="text-sm">{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-outline"><MapPin className="h-3 w-3" />Koordinat terverifikasi</p></td>
                          <td className="p-4"><div className="flex items-center gap-2"><Select value={report.status} disabled={updatingId === report.id} onValueChange={(value) => statusMutation.mutate({ id: report.id, nextStatus: value as ReportStatus })}><SelectTrigger className="h-10 w-40"><SelectValue /></SelectTrigger><SelectContent>{REPORT_STATUSES.map((item) => <SelectItem key={item} value={item}>{STATUS_LABELS[item]}</SelectItem>)}</SelectContent></Select>{updatingId === report.id && <Loader2 className="h-4 w-4 animate-spin text-outline" />}</div></td>
                          <td className="p-4 text-center"><span className="inline-flex items-center gap-1 text-sm font-semibold"><ThumbsUp className="h-4 w-4 text-secondary" />{report.vote_count ?? 0}</span></td>
                          <td className="p-4 text-right"><Link href={`/laporan/${report.id}`} className="inline-flex h-10 items-center rounded-lg border border-primary px-3 text-xs font-medium text-primary hover:bg-primary/5">Lihat detail</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-outline-variant/30 bg-surface px-5 py-4 text-xs text-outline"><span>Menampilkan {filtered.length} dari {reports.length} laporan</span></div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
