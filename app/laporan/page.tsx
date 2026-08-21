"use client";

import { useMemo, useState } from "react";
import { Search, AlertCircle } from "lucide-react";

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
  DUMMY_REPORTS,
  CATEGORY_LABELS,
  STATUS_LABELS,
} from "@/lib/dummy-reports";
import { REPORT_CATEGORIES, REPORT_STATUSES } from "@/lib/constants/reports";
import type { ReportCategory, ReportStatus } from "@/lib/types";

export default function LaporanPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ReportCategory | "all">("all");
  const [status, setStatus] = useState<ReportStatus | "all">("all");

  const filtered = useMemo(() => {
    return DUMMY_REPORTS.filter((r) => {
      const matchSearch =
        search.trim() === "" ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "all" || r.category === category;
      const matchStat = status === "all" || r.status === status;
      return matchSearch && matchCat && matchStat;
    });
  }, [search, category, status]);

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
            {filtered.length} laporan
          </span>
        </div>

        {/* Report grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
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
