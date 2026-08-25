"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  ImageOff,
  Loader2,
  MapPin,
  MoveHorizontal,
  Share2,
  ThumbsUp,
  Trash2,
} from "lucide-react";

import MapView from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/constants/reports";
import { createClient } from "@/lib/supabase/client";
import type { StatusLogRow } from "@/lib/supabase/types";
import type { Report, ReportStatus } from "@/lib/types";

const STEPS: { status: ReportStatus; label: string }[] = [
  { status: "dilaporkan", label: "Dilaporkan" },
  { status: "diproses", label: "Diproses" },
  { status: "menunggu_konfirmasi", label: "Menunggu Konfirmasi" },
  { status: "selesai", label: "Selesai" },
];

const statusPill: Record<ReportStatus, string> = {
  dilaporkan: "border-outline-variant bg-surface-container text-on-surface-variant",
  diproses: "border-secondary/20 bg-secondary-container/20 text-on-secondary-container",
  menunggu_konfirmasi: "border-amber-300/50 bg-amber-50 text-amber-700",
  selesai: "border-tertiary/15 bg-tertiary/10 text-tertiary",
};

function DetailHeader({ title, onShare }: { title: string; onShare?: () => void }) {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-outline-variant/20 bg-surface/96 px-4 shadow-sm backdrop-blur-md">
      <Link href="/laporan" aria-label="Kembali ke daftar laporan" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ArrowLeft className="h-6 w-6" />
      </Link>
      <h1 className="mx-2 min-w-0 flex-1 truncate text-center font-heading text-lg font-bold text-primary">{title}</h1>
      <button type="button" onClick={onShare} disabled={!onShare} aria-label="Bagikan laporan" className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-40">
        <Share2 className="h-5 w-5" />
      </button>
    </header>
  );
}

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const reportId = params?.id;
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [renderTimestamp] = useState(() => Date.now());
  const [confirmPending, setConfirmPending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
      setIsAdmin(data.user?.user_metadata?.role === "admin");
    });
  }, []);

  const { data: report, isLoading, isError } = useQuery<Report | null>({
    queryKey: ["report", reportId],
    queryFn: async () => {
      if (!reportId) return null;
      const { data, error } = await createClient().from("reports").select("*").eq("id", reportId).maybeSingle();
      if (error) throw error;
      return (data as Report) ?? null;
    },
    enabled: Boolean(reportId),
  });

  const { data: statusLogs = [] } = useQuery<StatusLogRow[]>({
    queryKey: ["status_logs", reportId],
    queryFn: async () => {
      if (!reportId) return [];
      const { data, error } = await createClient().from("status_logs").select("*").eq("report_id", reportId).order("changed_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(reportId),
  });

  const { data: hasVoted = false, refetch: refetchVoted } = useQuery<boolean>({
    queryKey: ["user_voted", reportId, currentUserId],
    queryFn: async () => {
      if (!reportId || !currentUserId) return false;
      const { data } = await createClient().from("votes").select("id").eq("report_id", reportId).eq("user_id", currentUserId).maybeSingle();
      return Boolean(data);
    },
    enabled: Boolean(reportId && currentUserId),
  });

  const voteMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) {
        router.push(`/auth/login?next=${encodeURIComponent(`/laporan/${reportId}`)}`);
        throw new Error("UNAUTHORIZED");
      }
      const response = await fetch(`/api/laporan/${reportId}/vote`, { method: "POST" });
      if (response.status === 409) throw new Error("ALREADY_VOTED");
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Gagal mengirim dukungan");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Terima kasih telah mendukung laporan ini.");
      queryClient.invalidateQueries({ queryKey: ["report", reportId] });
      refetchVoted();
    },
    onError: (error: Error) => {
      if (error.message === "ALREADY_VOTED") {
        toast.info("Anda sudah mendukung laporan ini.");
        refetchVoted();
      } else if (error.message !== "UNAUTHORIZED") {
        toast.error(error.message);
      }
    },
  });

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: report?.title ?? "Laporan SigapKota", url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Tautan laporan disalin.");
  }

  async function handleKonfirmasi() {
    if (!reportId) return;
    setConfirmPending(true);
    try {
      const response = await fetch(`/api/laporan/${reportId}/konfirmasi`, { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Gagal mengkonfirmasi");
      }
      toast.success("Laporan dikonfirmasi selesai. Terima kasih!");
      queryClient.invalidateQueries({ queryKey: ["report", reportId] });
      queryClient.invalidateQueries({ queryKey: ["status_logs", reportId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengkonfirmasi");
    } finally {
      setConfirmPending(false);
    }
  }

  async function handleDelete() {
    if (!reportId) return;
    setDeletePending(true);
    try {
      const response = await fetch(`/api/laporan/${reportId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason.trim() }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Gagal menghapus laporan");
      }
      toast.success("Laporan berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      router.push("/laporan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus laporan");
    } finally {
      setDeletePending(false);
      setDeleteOpen(false);
      setDeleteReason("");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface">
        <DetailHeader title="Memuat laporan..." />
        <main className="mx-auto max-w-3xl space-y-6 px-4 py-5">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="min-h-screen bg-surface">
        <DetailHeader title="Laporan" />
        <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <AlertTriangle className="mb-3 h-12 w-12 text-outline" />
          <h1 className="font-heading text-xl font-semibold">Laporan tidak ditemukan</h1>
          <p className="mt-1 text-sm text-outline">ID laporan tidak valid atau sudah dihapus.</p>
          <Link href="/laporan" className="mt-4"><Button variant="outline">Kembali ke daftar</Button></Link>
        </main>
      </div>
    );
  }

  const currentStep = STEPS.findIndex((step) => step.status === report.status);
  const activity = [...statusLogs].reverse();
  const reportedDate = new Date(report.created_at);
  const daysAgo = Math.max(0, Math.floor((renderTimestamp - reportedDate.getTime()) / 86_400_000));

  return (
    <div className="min-h-screen bg-surface">
      <DetailHeader title={report.title} onShare={handleShare} />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-12 pt-5">

        {/* Banner konfirmasi selesai - hanya muncul untuk pemilik laporan */}
        {report.status === "menunggu_konfirmasi" && report.user_id === currentUserId && (
          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
            <div className="flex items-start gap-3 border-b border-amber-200/60 bg-amber-100/50 px-5 py-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-amber-900">Laporan Anda Sudah Ditangani</p>
                <p className="mt-0.5 text-sm text-amber-700">
                  Admin telah mengupload foto bukti. Periksa foto di bawah lalu konfirmasi.
                </p>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-amber-800">
                Apakah masalah yang Anda laporkan benar-benar sudah diselesaikan? Konfirmasi hanya jika Anda puas dengan penanganannya.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  className="h-11 flex-1 gap-2 bg-amber-600 text-white hover:bg-amber-700"
                  disabled={confirmPending}
                  onClick={handleKonfirmasi}
                >
                  {confirmPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <CheckCircle2 className="h-4 w-4" />}
                  Ya, sudah selesai
                </Button>
              </div>
            </div>
          </div>
        )}
        <section className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-xl bg-surface-container shadow-sm md:aspect-video">
          {report.photo_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={report.photo_url} alt={`Foto sebelum penanganan ${report.title}`} className="absolute inset-0 h-full w-full object-cover" />
              {report.photo_after_url && (
                <>
                  <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={report.photo_after_url} alt={`Foto setelah penanganan ${report.title}`} className="absolute inset-0 h-full w-full object-cover" />
                    <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">Sesudah</span>
                  </div>
                  <span className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">Sebelum</span>
                  <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 z-10 w-1 -translate-x-1/2 bg-white shadow-lg" style={{ left: `${sliderPosition}%` }}>
                    <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-outline shadow-md"><MoveHorizontal className="h-4 w-4" /></span>
                  </div>
                  <input type="range" min="0" max="100" value={sliderPosition} onChange={(event) => setSliderPosition(Number(event.target.value))} aria-label="Bandingkan foto sebelum dan sesudah" className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0" />
                </>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-outline-variant"><ImageOff className="h-12 w-12" /></div>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusPill[report.status]}`}><CheckCircle2 className="h-4 w-4" />{STATUS_LABELS[report.status]}</span>
            <span className="text-xs text-outline">Dilaporkan {daysAgo === 0 ? "hari ini" : `${daysAgo} hari lalu`}</span>
          </div>
          <h2 className="font-heading text-[26px] font-bold leading-8 tracking-[-0.02em] text-on-surface sm:text-3xl">{report.title}</h2>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="rounded-lg bg-tertiary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-tertiary">{CATEGORY_LABELS[report.category]}</span>
            <span className="flex items-center gap-1 rounded-lg bg-surface-container px-3 py-1.5 text-xs text-on-surface-variant"><MapPin className="h-4 w-4" />{report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</span>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-xl border border-surface-highest bg-surface-lowest p-5 shadow-sm">
          {/* connector line */}
          <div className="absolute left-[calc(12.5%+18px)] right-[calc(12.5%+18px)] top-[38px] h-0.5 bg-surface-highest" />
          <div className="relative z-10 grid grid-cols-4 gap-1">
            {STEPS.map((step, index) => {
              const completed = index <= currentStep;
              const current = index === currentStep;
              return (
                <div key={step.status} className="flex flex-col items-center gap-2 bg-surface-lowest px-1 text-center">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${completed ? "border-primary bg-primary text-primary-foreground" : "border-outline-variant bg-surface text-outline"} ${current ? "ring-4 ring-primary/15" : ""}`}>
                    {completed ? <Check className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                  </span>
                  <span className={`text-[10px] leading-tight sm:text-xs ${completed ? "font-semibold text-primary" : "text-outline"}`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="font-heading text-xl font-semibold">Deskripsi</h3>
          <div className="rounded-xl border border-surface-highest bg-surface-lowest p-4 text-base leading-6 text-on-surface-variant">
            {report.description || "Tidak ada deskripsi tambahan untuk laporan ini."}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="font-heading text-xl font-semibold">Peta Lokasi</h3>
          <div className="h-48 overflow-hidden rounded-xl border border-surface-highest bg-surface-container shadow-sm">
            <MapView reports={[report]} center={[report.latitude, report.longitude]} zoom={16} viewMode="marker" />
          </div>
        </section>

        <section className="flex items-center gap-4 border-y border-surface-highest py-6">
          <Button onClick={() => voteMutation.mutate()} disabled={hasVoted || voteMutation.isPending} className="h-12 shrink-0 rounded-full px-6 text-xs font-bold tracking-wider">
            {voteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-5 w-5" />}
            {report.vote_count ?? 0} DUKUNGAN
          </Button>
          <p className="max-w-xs text-xs leading-4 text-outline">{hasVoted ? "Anda sudah menandai laporan ini sebagai prioritas." : "Dukung agar laporan ini mendapat prioritas penanganan."}</p>
        </section>

        {/* Hapus laporan - pemilik atau admin */}
        {(report.user_id === currentUserId || isAdmin) && (
          <section className="flex items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-semibold text-on-surface">Hapus laporan ini</p>
              <p className="mt-0.5 text-xs text-outline">Gunakan jika laporan ini spam atau tidak valid. Alasan wajib diisi dan dicatat dalam log.</p>
            </div>
            <Button variant="destructive" className="h-10 shrink-0 gap-2" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Hapus
            </Button>
          </section>
        )}

        <section className="space-y-4 pb-6">
          <h3 className="font-heading text-xl font-semibold">Log Aktivitas</h3>
          <div className="relative ml-4 space-y-6 border-l-2 border-surface-highest py-1 pl-6">
            {activity.length > 0 ? activity.map((log, index) => (
              <div key={log.id} className="relative">
                <span className={`absolute -left-[33px] top-1 h-4 w-4 rounded-full border-4 border-surface ${index === 0 ? "bg-primary ring-2 ring-primary/10" : "bg-outline-variant"}`} />
                <div className={index === 0 ? "rounded-lg border border-surface-highest bg-surface-lowest p-3 shadow-sm" : ""}>
                  <p className="font-medium text-on-surface">{STATUS_LABELS[log.new_status as ReportStatus] ?? log.new_status}</p>
                  <p className="mt-1 text-xs text-outline">{log.changed_at ? new Date(log.changed_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</p>
                </div>
              </div>
            )) : (
              <div className="relative">
                <span className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-4 border-surface bg-primary ring-2 ring-primary/10" />
                <div className="rounded-lg border border-surface-highest bg-surface-lowest p-3 shadow-sm">
                  <p className="font-medium text-on-surface">{STATUS_LABELS[report.status]}</p>
                  <p className="mt-1 text-xs text-outline">{reportedDate.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Dialog konfirmasi hapus */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus laporan ini?</DialogTitle>
            <DialogDescription>
              Laporan &ldquo;{report.title}&rdquo; akan dihapus permanen beserta seluruh dukungannya. Penghapusan dicatat dalam log sistem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="delete-reason" className="text-sm font-medium text-on-surface">
              Alasan penghapusan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="delete-reason"
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              placeholder="Contoh: laporan spam, duplikat, atau tidak valid"
              rows={3}
              maxLength={300}
              className="resize-none rounded-lg border-outline-variant bg-surface-lowest text-sm focus-visible:border-primary"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deletePending}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletePending || !deleteReason.trim()} className="gap-2">
              {deletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Ya, hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
