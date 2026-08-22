"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import MapFilters from "@/components/MapView/MapFilters";
import {
  CATEGORY_LABELS,
  STATUS_BADGE_VARIANTS,
  STATUS_LABELS,
} from "@/lib/constants/reports";
import type { Report, ReportCategory, ReportStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, Calendar, X, AlertCircle, Plus } from "lucide-react";

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

  // Filter reports based on active selection
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchCategory = selectedCategory === "all" || report.category === selectedCategory;
      const matchStatus = selectedStatus === "all" || report.status === selectedStatus;
      return matchCategory && matchStatus;
    });
  }, [reports, selectedCategory, selectedStatus]);

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

  return (
    // Mobile: fill exactly the space above the fixed BottomNav by mirroring the
    // padding RootLayout reserves (pb-[calc(5rem+env(safe-area-inset-bottom))]),
    // so content + padding sums to 100dvh with no phantom page scroll and the
    // preview card never hides behind the nav. Desktop keeps full h-screen.
    <div className="flex h-[calc(100dvh-(5rem+env(safe-area-inset-bottom)))] flex-col bg-background md:h-screen">
      <Navbar />

      <main className="relative flex flex-1 flex-col overflow-hidden p-2 sm:p-4 gap-2 sm:gap-3">
        {/* Filter controls */}
        <MapFilters
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          onCategoryChange={setSelectedCategory}
          onStatusChange={setSelectedStatus}
          onReset={handleResetFilters}
          totalResults={filteredReports.length}
          totalAll={reports.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Map Container */}
        <div className="relative flex-1 w-full overflow-hidden rounded-lg">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center rounded-lg border bg-muted/20">
              <div className="space-y-3 text-center">
                <Skeleton className="mx-auto h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-48" />
                <p className="text-xs text-muted-foreground">Memuat peta dan laporan...</p>
              </div>
            </div>
          ) : isError ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-4 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-2" />
              <h3 className="text-base font-semibold">Gagal Memuat Laporan</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                Terjadi kesalahan saat mengambil data laporan dari server.
              </p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Coba Lagi
              </Button>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-4 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="text-base font-semibold">Tidak Ada Laporan Ditemukan</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                Tidak ada laporan yang sesuai dengan kombinasi filter kategori dan status saat ini.
              </p>
              <Button size="sm" variant="outline" onClick={handleResetFilters}>
                Reset Filter
              </Button>
            </div>
          ) : null}

          {!isLoading && !isError && (
            <MapView
              reports={filteredReports}
              selectedReportId={selectedReport?.id}
              onSelectReport={handleSelectReport}
              center={
                selectedReport
                  ? [selectedReport.latitude, selectedReport.longitude]
                  : DEFAULT_CENTER
              }
              zoom={selectedReport ? SELECTED_REPORT_ZOOM : DEFAULT_ZOOM}
              viewMode={viewMode}
              onSwitchToMarker={handleSwitchToMarker}
            />
          )}

          {/* Floating Action Button: sembunyikan halus saat kartu pratinjau terbuka
              agar tidak menutupi kartu maupun atribusi peta */}
          <Link
            href="/laporan/baru"
            aria-label="Buat Laporan"
            className={`absolute bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg shadow-secondary/30 transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:bottom-8 md:right-8 md:h-16 md:w-16 ${
              selectedReport
                ? "pointer-events-none translate-y-2 opacity-0"
                : "opacity-100"
            }`}
          >
            <Plus className="h-6 w-6" />
          </Link>

          {/* Selected Report Quick Preview Card Overlay */}
          {selectedReport && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-20 sm:w-96">
              <Card className="shadow-lg border-2 bg-card/95 backdrop-blur">
                <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {CATEGORY_LABELS[selectedReport.category]}
                      </Badge>
                      <Badge
                        variant={STATUS_BADGE_VARIANTS[selectedReport.status]}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {STATUS_LABELS[selectedReport.status]}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-semibold leading-tight line-clamp-1">
                      {selectedReport.title}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Tutup pratinjau"
                    className="h-6 w-6 rounded-full -mr-1 -mt-1"
                    onClick={handleClosePreview}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>

                <CardContent className="p-3 pt-0 space-y-2.5">
                  {selectedReport.photo_url && (
                    <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedReport.photo_url}
                        alt={selectedReport.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  {selectedReport.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {selectedReport.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium text-foreground">
                        {selectedReport.vote_count ?? 0}
                      </span>{" "}
                      dukungan
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(selectedReport.created_at).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
