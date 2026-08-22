"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, AlertCircle, Loader2 } from "lucide-react";

import Navbar from "@/components/Navbar";
import ReportCard from "@/components/ReportCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  STATUS_LABELS,
  REPORT_CATEGORIES,
  REPORT_STATUSES,
} from "@/lib/constants/reports";
import type { Report, ReportCategory, ReportStatus } from "@/lib/types";

async function fetchReports(): Promise<Report[]> {
  const res = await fetch("/api/laporan");
  if (!res.ok) throw new Error("Gagal memuat laporan");
  return res.json();
}

export default function LaporanPage() {
  const { data: reports = [], isLoading, isError, refetch } = useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: fetchReports,
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ReportCategory | "all">("all");
  const [status, setStatus] = useState<ReportStatus | "all">("all");

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        search.trim() === "" ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "all" || r.category === category;
      const matchStat = status === "all" || r.status === status;
      return matchSearch && matchCat && matchStat;
    });
  }, [reports, search, category, status]);

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
  };

  const isFiltered = search.trim() !== "" || category !== "all" || status !== "all";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="container flex-1 px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Daftar Laporan</h1>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul atau deskripsi..."
              className="h-9 pl-9 text-sm"
            />
          </div>

          <Select
            value={category}
            onValueChange={(v) => setCategory(v as ReportCategory | "all")}
          >
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {REPORT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(v) => setStatus(v as ReportStatus | "all")}
          >
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {REPORT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isFiltered && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-xs">
              Reset
            </Button>
          )}

          <span className="ml-auto text-xs text-muted-foreground">
            {isLoading ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Memuat...
              </span>
            ) : (
              `${filtered.length} laporan`
            )}
          </span>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-lg border p-4">
                <Skeleton className="aspect-video w-full rounded-md" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="text-base font-semibold">Gagal memuat laporan</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Terjadi kesalahan saat menghubungi server. Silakan coba lagi.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Report grid */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-semibold">Tidak ada laporan ditemukan</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Coba ubah kata kunci pencarian atau reset filter.
            </p>
            {isFiltered && (
              <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                Reset Filter
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
