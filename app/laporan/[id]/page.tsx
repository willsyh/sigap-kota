"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  ThumbsUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
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
import {
  DUMMY_REPORTS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  STATUS_BADGE_VARIANTS,
} from "@/lib/dummy-reports";
import type { ReportStatus } from "@/lib/types";

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
  const report = DUMMY_REPORTS.find((r) => r.id === params.id);

  if (!report) {
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
              <p className="text-sm text-muted-foreground leading-relaxed">
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

          {/* Right column: vote, timeline, mini map */}
          <div className="lg:col-span-2 space-y-4">
            {/* Vote card */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Dukungan Warga</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{report.vote_count}</span>
                  <span className="text-xs text-muted-foreground">suara</span>
                </div>
                <Button size="sm" className="gap-1">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Dukung
                </Button>
              </CardContent>
            </Card>

            {/* Status timeline */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Status Penanganan</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
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
