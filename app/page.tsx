"use client";

import { useState, useMemo } from "react";
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
import { ThumbsUp, Calendar, X, AlertCircle } from "lucide-react";

async function fetchReports(): Promise<Report[]> {
  const res = await fetch("/api/laporan");
  if (!res.ok) throw new Error("Gagal memuat laporan");
  return res.json();
}

export default function Home() {
  const { data: reports = [], isLoading, isError, refetch } = useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: fetchReports,
  });

  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "all">("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Filter reports based on active selection
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchCategory = selectedCategory === "all" || report.category === selectedCategory;
      const matchStatus = selectedStatus === "all" || report.status === selectedStatus;
      return matchCategory && matchStatus;
    });
  }, [reports, selectedCategory, selectedStatus]);

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSelectedStatus("all");
  };

  return (
    <div className="flex h-screen flex-col bg-background">
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
              onSelectReport={(report) => setSelectedReport(report)}
              center={selectedReport ? [selectedReport.latitude, selectedReport.longitude] : [-6.3458, 106.7394]}
              zoom={selectedReport ? 15 : 13}
            />
          )}

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
                    className="h-6 w-6 rounded-full -mr-1 -mt-1"
                    onClick={() => setSelectedReport(null)}
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
                      <span className="font-medium text-foreground">{selectedReport.vote_count}</span> dukungan
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
