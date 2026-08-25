"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import HomeMapControls from "@/components/MapView/HomeMapControls";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
} from "@/lib/constants/reports";
import { createClient } from "@/lib/supabase/client";
import type { Report, ReportCategory, ReportStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CalendarDays,
  Plus,
  ThumbsUp,
  X,
} from "lucide-react";

async function fetchReports(): Promise<Report[]> {
  const res = await fetch("/api/laporan");
  if (!res.ok) throw new Error("Gagal memuat laporan");
  return res.json();
}

// Civic Horizon home defaults: city-wide view of Pamulang used whenever no
// report is selected. Module-level constants keep prop identities stable so
// the map controller never re-anchors on unrelated re-renders.
const DEFAULT_CENTER: [number, number] = [-6.3458, 106.7394];
const DEFAULT_ZOOM = 13;
const SELECTED_REPORT_ZOOM = 15;

export default function Home() {
  const { data: reports = [], isLoading, isError, refetch } = useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: fetchReports,
  });

  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "all">("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [viewMode, setViewMode] = useState<"marker" | "heatmap">("heatmap");
  const [query, setQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    createClient().auth.getUser().then(({ data }) => {
      if (active) setIsAdmin(data.user?.user_metadata?.role === "admin");
    });
    return () => { active = false; };
  }, []);

  // Filter reports based on active selection
  const filteredReports = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");

    return reports.filter((report) => {
      const matchCategory = selectedCategory === "all" || report.category === selectedCategory;
      const matchStatus = selectedStatus === "all" || report.status === selectedStatus;
      const searchableText = [
        report.id,
        report.title,
        report.description,
        CATEGORY_LABELS[report.category],
        STATUS_LABELS[report.status],
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("id-ID");
      const matchQuery = !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchCategory && matchStatus && matchQuery;
    });
  }, [reports, query, selectedCategory, selectedStatus]);

  // Stabilized callbacks: MapView correctness must not depend on the React
  // compiler memoizing inline closures.

  // Stabilized callbacks: MapView correctness must not depend on the React
  // compiler memoizing inline closures.
  const handleResetFilters = useCallback(() => {
    setSelectedCategory("all");
    setSelectedStatus("all");
  }, []);

  const handleSelectReport = useCallback((report: Report) => {
    setSelectedReport(report);
  }, []);

  const handleClosePreview = useCallback(() => setSelectedReport(null), []);

  const handleSwitchToMarker = useCallback(() => setViewMode("marker"), []);

  const visibleSelectedReport =
    selectedReport && filteredReports.some((report) => report.id === selectedReport.id)
      ? selectedReport
      : null;

  const statusDotClass: Record<ReportStatus, string> = {
    dilaporkan: "bg-outline",
    diproses: "bg-secondary",
    menunggu_konfirmasi: "bg-amber-400",
    selesai: "bg-tertiary",
  };

  return (
    <div className="flex h-[calc(100dvh-(5rem+env(safe-area-inset-bottom)))] flex-col overflow-hidden bg-surface md:h-screen">
      <Navbar
        viewMode={viewMode}
        onViewModeToggle={() =>
          setViewMode((mode) => (mode === "marker" ? "heatmap" : "marker"))
        }
      />

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <HomeMapControls
          query={query}
          onQueryChange={setQuery}
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          onCategoryChange={setSelectedCategory}
          onStatusChange={setSelectedStatus}
          onReset={handleResetFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalResults={filteredReports.length}
          isAdmin={isAdmin}
        />

        <div className="absolute inset-0 overflow-hidden bg-surface-container">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center bg-surface-container">
              <div className="space-y-3 text-center">
                <Skeleton className="mx-auto h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-48" />
                <p className="text-xs text-muted-foreground">Memuat peta dan laporan...</p>
              </div>
            </div>
          ) : isError ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/85 p-4 text-center backdrop-blur-sm">
              <AlertCircle className="h-10 w-10 text-destructive mb-2" />
              <h3 className="text-base font-semibold">Gagal Memuat Laporan</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                Terjadi kesalahan saat mengambil data laporan dari server.
              </p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Coba Lagi
              </Button>
            </div>
          ) : null}

          {!isLoading && !isError && (
            <MapView
              reports={filteredReports}
              selectedReportId={visibleSelectedReport?.id}
              onSelectReport={handleSelectReport}
              center={
                visibleSelectedReport
                  ? [visibleSelectedReport.latitude, visibleSelectedReport.longitude]
                  : DEFAULT_CENTER
              }
              zoom={visibleSelectedReport ? SELECTED_REPORT_ZOOM : DEFAULT_ZOOM}
              viewMode={viewMode}
              onSwitchToMarker={handleSwitchToMarker}
            />
          )}

          {!isLoading && !isError && filteredReports.length === 0 && (
            <div className="absolute left-1/2 top-[55%] z-20 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-outline-variant/60 bg-surface-lowest/95 p-4 text-center shadow-lg backdrop-blur">
              <p className="text-sm font-semibold text-foreground">Laporan tidak ditemukan</p>
              <p className="mt-1 text-xs text-outline">
                Coba kata pencarian lain atau reset filter yang aktif.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  handleResetFilters();
                }}
                className="mt-2 cursor-pointer text-primary"
              >
                Reset pencarian
              </Button>
            </div>
          )}

          <Link
            href="/laporan/baru"
            aria-label="Buat Laporan"
            className="absolute bottom-5 right-4 z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-[0_8px_24px_rgba(142,78,20,0.28)] transition-colors duration-200 hover:bg-secondary/90 active:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:bottom-8 md:right-8 md:h-16 md:w-16"
          >
            <Plus className="h-7 w-7" strokeWidth={2.2} />
          </Link>

          {visibleSelectedReport && (
            <div className="absolute bottom-5 left-4 right-[5.25rem] z-30 max-w-md md:bottom-8 md:left-8 md:right-auto md:w-[28rem]">
              <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/45 bg-surface-lowest/96 p-3 shadow-[0_6px_24px_rgba(0,83,91,0.16)] backdrop-blur-md">
                {visibleSelectedReport.photo_url ? (
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-container">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={visibleSelectedReport.photo_url}
                      alt={visibleSelectedReport.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-container text-primary">
                    <AlertCircle className="h-7 w-7" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 pr-10">
                    <span className="max-w-[55%] truncate rounded-full bg-tertiary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-tertiary">
                      {CATEGORY_LABELS[visibleSelectedReport.category]}
                    </span>
                    <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-outline">
                      <span className={`h-2 w-2 rounded-full ${statusDotClass[visibleSelectedReport.status]}`} />
                      {STATUS_LABELS[visibleSelectedReport.status]}
                    </span>
                  </div>
                  <Link
                    href={`/laporan/${visibleSelectedReport.id}`}
                    className="block truncate text-sm font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {visibleSelectedReport.title}
                  </Link>
                  <div className="mt-2 flex items-center gap-4 text-[11px] text-outline">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(visibleSelectedReport.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {visibleSelectedReport.vote_count ?? 0} dukungan
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Tutup pratinjau"
                  onClick={handleClosePreview}
                  className="absolute right-0 top-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-outline transition-colors hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
