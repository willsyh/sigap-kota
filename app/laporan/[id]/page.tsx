"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  ThumbsUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  History,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  STATUS_BADGE_VARIANTS,
} from "@/lib/constants/reports";
import { createClient } from "@/lib/supabase/client";
import type { Report, ReportStatus } from "@/lib/types";
import type { StatusLogRow } from "@/lib/supabase/types";

const STATUS_ICONS: Record<ReportStatus, typeof Clock> = {
  dilaporkan: AlertTriangle,
  diproses: Clock,
  selesai: CheckCircle2,
};

const TIMELINE_STEPS: { status: ReportStatus; label: string }[] = [
  { status: "dilaporkan", label: "Dilaporkan" },
  { status: "diproses", label: "Diproses" },
  { status: "selesai", label: "Selesai" },
];

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const reportId = params?.id;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        setCurrentUserId(data.user?.id ?? null);
      });
  }, []);

  // Fetch report
  const {
    data: report,
    isLoading: reportLoading,
    isError: reportError,
  } = useQuery<Report | null>({
    queryKey: ["report", reportId],
    queryFn: async () => {
      if (!reportId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .maybeSingle();

      if (error) throw error;
      return (data as Report) ?? null;
    },
    enabled: Boolean(reportId),
  });

  // Fetch status logs
  const { data: statusLogs = [] } = useQuery<StatusLogRow[]>({
    queryKey: ["status_logs", reportId],
    queryFn: async () => {
      if (!reportId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("status_logs")
        .select("*")
        .eq("report_id", reportId)
        .order("changed_at", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(reportId),
  });

  // Check if current user already voted
  const { data: hasVoted = false, refetch: refetchVoted } = useQuery<boolean>({
    queryKey: ["user_voted", reportId, currentUserId],
    queryFn: async () => {
      if (!reportId || !currentUserId) return false;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("votes")
        .select("id")
        .eq("report_id", reportId)
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (error) return false;
      return Boolean(data);
    },
    enabled: Boolean(reportId && currentUserId),
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) {
        toast.info("Silakan masuk terlebih dahulu untuk mendukung laporan.");
        router.push(
          `/auth/login?next=${encodeURIComponent(`/laporan/${reportId}`)}`,
        );
        throw new Error("UNAUTHORIZED");
      }

      const res = await fetch(`/api/laporan/${reportId}/vote`, {
        method: "POST",
      });

      if (res.status === 409) {
        throw new Error("ALREADY_VOTED");
      }

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Gagal mengirim dukungan");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Terima kasih telah mendukung laporan ini!");
      queryClient.invalidateQueries({ queryKey: ["report", reportId] });
      refetchVoted();
    },
    onError: (err: Error) => {
      if (err.message === "ALREADY_VOTED") {
        toast.info("Kamu sudah mendukung laporan ini");
        refetchVoted();
      } else if (err.message !== "UNAUTHORIZED") {
        toast.error(err.message || "Gagal mendukung laporan");
      }
    },
  });

  if (reportLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="container flex-1 px-4 py-6 space-y-6">
          <Skeleton className="h-6 w-24" />
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-44 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (reportError || !report) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-3" />
          <h1 className="text-lg font-semibold">Laporan tidak ditemukan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ID laporan tidak valid atau sudah dihapus.
          </p>
          <Link href="/laporan">
            <Button variant="outline" size="sm" className="mt-4">
              Kembali ke daftar
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const currentStepIdx = TIMELINE_STEPS.findIndex((s) => s.status === report.status);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="container flex-1 px-4 py-6 space-y-6">
        {/* Back */}
        <Link
          href="/laporan"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left column: image + info */}
          <div className="lg:col-span-3 space-y-4">
            {/* Photo */}
            {report.photo_url && (
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={report.photo_url}
                  alt={report.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Title + badges */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: CATEGORY_COLORS[report.category],
                    color: CATEGORY_COLORS[report.category],
                  }}
                >
                  {CATEGORY_LABELS[report.category]}
                </Badge>
                <Badge
                  variant={STATUS_BADGE_VARIANTS[report.status]}
                  className="text-xs"
                >
                  {STATUS_LABELS[report.status]}
                </Badge>
              </div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {report.title}
              </h1>
            </div>

            {/* Description */}
            {report.description && (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {report.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(report.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Right column: vote, timeline, logs, mini map */}
          <div className="lg:col-span-2 space-y-4">
            {/* Vote card */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Dukungan Warga</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{report.vote_count ?? 0}</span>
                  <span className="text-xs text-muted-foreground">suara</span>
                </div>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => voteMutation.mutate()}
                  disabled={hasVoted || voteMutation.isPending}
                  variant={hasVoted ? "secondary" : "default"}
                >
                  {voteMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-3.5 w-3.5" />
                  )}
                  {hasVoted ? "Didukung" : "Dukung"}
                </Button>
              </CardContent>
            </Card>

            {/* Status timeline */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Status Penanganan</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                <ol className="space-y-3">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    const Icon = STATUS_ICONS[step.status];
                    return (
                      <li key={step.status} className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                            isCompleted
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              isCompleted ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-[11px] text-muted-foreground">Status saat ini</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>

                {/* Activity logs jika ada */}
                {statusLogs.length > 0 && (
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <History className="h-3.5 w-3.5" />
                      <span>Riwayat Pembaruan Status</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {statusLogs.map((log) => (
                        <li key={log.id} className="flex items-center justify-between">
                          <span>
                            {log.old_status
                              ? `${STATUS_LABELS[log.old_status as ReportStatus] ?? log.old_status} → `
                              : ""}
                            <strong className="text-foreground">
                              {STATUS_LABELS[log.new_status as ReportStatus] ?? log.new_status}
                            </strong>
                          </span>
                          <span className="text-[11px]">
                            {log.changed_at
                              ? new Date(log.changed_at).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mini map */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Lokasi</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="h-48 w-full overflow-hidden rounded-md">
                  <MapView
                    reports={[report]}
                    center={[report.latitude, report.longitude]}
                    zoom={16}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
