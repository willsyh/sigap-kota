"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Search, SlidersHorizontal } from "lucide-react";

import Navbar from "@/components/Navbar";
import ReportCard from "@/components/ReportCard";
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
import type { Report, ReportCategory, ReportStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

async function fetchReports(): Promise<Report[]> {
  const response = await fetch("/api/laporan");
  if (!response.ok) throw new Error("Gagal memuat laporan");
  return response.json();
}

export default function LaporanPage() {
  const { data: reports = [], isLoading, isError, refetch } = useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: fetchReports,
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ReportCategory | "all">("all");
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("id-ID");
    return reports.filter((report) => {
      const matchesSearch =
        !normalizedSearch ||
        [report.id, report.title, report.description]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("id-ID")
          .includes(normalizedSearch);
      return (
        matchesSearch &&
        (category === "all" || report.category === category) &&
        (status === "all" || report.status === status)
      );
    });
  }, [category, reports, search, status]);

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
  };

  const chipClass = (active: boolean) =>
    cn(
      "flex h-9 shrink-0 cursor-pointer items-center rounded-full border px-4 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active
        ? "border-primary bg-primary text-primary-foreground shadow-sm"
        : "border-outline-variant bg-surface-lowest text-on-surface-variant hover:bg-surface-container",
    );

  return (
    <div className="min-h-screen bg-surface pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4">
        <section className="sticky top-16 z-30 bg-surface/96 pb-3 pt-4 backdrop-blur-md">
          <div className="mb-4 flex rounded-xl bg-surface-high p-1 shadow-sm">
            <Link href="/" className="flex h-10 flex-1 items-center justify-center rounded-lg text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container">
              Tampilan Peta
            </Link>
            <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-surface-lowest text-xs font-semibold text-primary shadow-sm">
              Tampilan Daftar
            </div>
          </div>

          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={resetFilters} className={chipClass(category === "all" && status === "all" && !search)}>
              Semua Laporan
            </button>
            <button type="button" onClick={() => setCategory(category === "jalan_rusak" ? "all" : "jalan_rusak")} className={chipClass(category === "jalan_rusak")}>
              Jalan Rusak
            </button>
            <button type="button" onClick={() => setStatus(status === "diproses" ? "all" : "diproses")} className={chipClass(status === "diproses")}>
              Sedang Diproses
            </button>
            <button type="button" onClick={() => setCategory(category === "fasilitas_umum" ? "all" : "fasilitas_umum")} className={chipClass(category === "fasilitas_umum")}>
              Fasilitas Umum
            </button>
            <button
              type="button"
              aria-label="Buka filter lengkap"
              aria-expanded={advancedOpen}
              onClick={() => setAdvancedOpen((open) => !open)}
              className={cn("flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-outline-variant bg-surface-lowest text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", advancedOpen && "border-primary text-primary")}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>

          {advancedOpen && (
            <div className="mt-3 grid gap-2 rounded-xl border border-outline-variant/40 bg-surface-lowest p-3 shadow-lg sm:grid-cols-[1fr_180px_160px_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari judul atau ID..." className="h-11 pl-9" />
              </div>
              <Select value={category} onValueChange={(value) => setCategory(value as ReportCategory | "all")}>
                <SelectTrigger className="h-11 w-full"><SelectValue placeholder="Kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua kategori</SelectItem>
                  {REPORT_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{CATEGORY_LABELS[item]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(value) => setStatus(value as ReportStatus | "all")}>
                <SelectTrigger className="h-11 w-full"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  {REPORT_STATUSES.map((item) => <SelectItem key={item} value={item}>{STATUS_LABELS[item]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" variant="ghost" onClick={resetFilters} className="h-11">Reset</Button>
            </div>
          )}
        </section>

        <section className="space-y-4 pb-8">
          {isLoading && Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex gap-4 rounded-xl border border-outline-variant/30 bg-surface-lowest p-3">
              <Skeleton className="h-24 w-24 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-3 py-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
            </div>
          ))}

          {!isLoading && isError && (
            <div className="flex flex-col items-center py-20 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
              <h2 className="font-heading text-lg font-semibold">Gagal memuat laporan</h2>
              <p className="mt-1 text-sm text-outline">Periksa koneksi, lalu coba kembali.</p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>Coba lagi</Button>
            </div>
          )}

          {!isLoading && !isError && filtered.map((report) => <ReportCard key={report.id} report={report} />)}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-outline-variant" />
              <h2 className="font-heading text-lg font-semibold">Laporan tidak ditemukan</h2>
              <p className="mt-1 max-w-xs text-sm text-outline">Tidak ada laporan yang sesuai dengan filter saat ini.</p>
              <Button variant="outline" className="mt-4" onClick={resetFilters}>Reset filter</Button>
            </div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <p className="pt-2 text-center text-xs text-outline">Menampilkan {filtered.length} laporan</p>
          )}
        </section>
      </main>
    </div>
  );
}
