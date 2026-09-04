"use client";

import { useState, useMemo, useCallback, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import HomeMapControls from "@/components/MapView/HomeMapControls";
import MapLegend from "@/components/MapView/MapLegend";
import PerceptionDialog from "@/components/perceptions/PerceptionDialog";
import type {
  PerceptionPoint,
  PerceptionSentiment,
} from "@/components/perceptions/PerceptionPulseCard";
import AreaPulsePopup from "@/components/perceptions/AreaPulsePopup";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
} from "@/lib/constants/reports";
import {
  PERCEPTION_SENTIMENTS,
  PERCEPTION_SENTIMENT_COLORS,
  PERCEPTION_SENTIMENT_LABELS,
} from "@/lib/constants/perceptions";
import { createClient } from "@/lib/supabase/client";
import type { Report, ReportCategory, ReportStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CalendarDays,
  Info,
  Loader2,
  Plus,
  ThumbsUp,
  X,
} from "lucide-react";

async function fetchReports(): Promise<Report[]> {
  const res = await fetch("/api/laporan");
  if (!res.ok) throw new Error("Gagal memuat laporan");
  return res.json();
}

async function fetchPerceptions(days: 7 | 30): Promise<PerceptionPoint[]> {
  const res = await fetch(`/api/persepsi?days=${days}`);
  if (!res.ok) throw new Error("Gagal memuat persepsi");
  return res.json();
}

// Civic Horizon home defaults: city-wide view of Pamulang used whenever no
// report is selected. Module-level constants keep prop identities stable so
// the map controller never re-anchors on unrelated re-renders.
const DEFAULT_CENTER: [number, number] = [-6.3458, 106.7394];
const DEFAULT_ZOOM = 13;
const SELECTED_REPORT_ZOOM = 15;

const INTRO_DISMISS_KEY = "sigapkota_intro_dismissed";

// Store kecil untuk status pengantar landing yang dipersistenkan di
// localStorage. useSyncExternalStore menghindari cascading render dari
// setState di dalam effect dan aman terhadap hydration (snapshot server
// selalu "tampil", lalu disinkronkan dengan nilai asli setelah hydrate).
const introStore = {
  listeners: new Set<() => void>(),
  read(): boolean {
    try {
      return window.localStorage.getItem(INTRO_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  },
  write(dismissed: boolean) {
    try {
      if (dismissed) window.localStorage.setItem(INTRO_DISMISS_KEY, "1");
      else window.localStorage.removeItem(INTRO_DISMISS_KEY);
    } catch {
      // Penyimpanan tidak tersedia: status hanya berlaku untuk sesi ini.
    }
    introStore.listeners.forEach((notify) => notify());
  },
  subscribe(listener: () => void) {
    introStore.listeners.add(listener);
    return () => {
      introStore.listeners.delete(listener);
    };
  },
};

export default function Home() {
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading, isError, refetch } = useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: fetchReports,
  });

  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "all">("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [viewMode, setViewMode] = useState<"pin" | "heatmap" | "unseen">("pin");
  const [query, setQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [days, setDays] = useState<7 | 30>(7);
  const [dialogPoint, setDialogPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [pulsePoint, setPulsePoint] = useState<{ lat: number; lng: number } | null>(null);

  // Data persepsi hanya diambil saat mode unseen aktif.
  const {
    data: perceptions = [],
    isLoading: perceptionsLoading,
    isError: perceptionsError,
  } = useQuery<PerceptionPoint[]>({
    queryKey: ["persepsi", days],
    queryFn: () => fetchPerceptions(days),
    enabled: viewMode === "unseen",
  });

  useEffect(() => {
    let active = true;
    createClient().auth.getUser().then(({ data }) => {
      if (active) setIsAdmin(data.user?.user_metadata?.role === "admin");
    });
    return () => { active = false; };
  }, []);

  const introDismissed = useSyncExternalStore(
    introStore.subscribe,
    () => introStore.read(),
    () => false,
  );

  const dismissIntro = useCallback(() => introStore.write(true), []);
  const reopenIntro = useCallback(() => introStore.write(false), []);

  // Mode non-pin (zona padat / unseen) butuh visibilitas peta penuh:
  // otomatis sembunyikan kartu intro saat masuk ke mode tersebut.
  const isIntroVisible = !introDismissed && viewMode === "pin";

  // Pencarian non-kosong selalu tampil dalam mode pin supaya efek filter
  // terlihat jelas (heatmap membuat hasil pencarian sulit dinilai).
  const handleQueryChange = useCallback((next: string) => {
    setQuery(next);
    if (next.trim()) setViewMode("pin");
  }, []);

  // Filter reports based on active selection.
  // Laporan selesai TETAP ditampilkan sebagai pin hijau: bukti bahwa
  // laporan ditangani adalah inti kepercayaan produk ini.
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

  // Agregat status untuk lapisan naratif: dilaporkan / sedang ditangani / selesai.
  const stats = useMemo(() => {
    let reported = 0;
    let inProgress = 0;
    let done = 0;
    for (const report of reports) {
      if (report.status === "dilaporkan") reported += 1;
      else if (report.status === "selesai") done += 1;
      else inProgress += 1;
    }
    return { reported, inProgress, done };
  }, [reports]);

  // Satu laporan selesai terbaru dengan foto sebelum + sesudah untuk kartu
  // bukti penanganan. Tanpa kedua foto, kartu tidak ditampilkan.
  const resolvedReport = useMemo(() => {
    return (
      [...reports]
        .filter(
          (report): report is Report & { photo_url: string; photo_after_url: string } =>
            Boolean(report.photo_url && report.photo_after_url),
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0] ?? null
    );
  }, [reports]);

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

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPulsePoint({ lat, lng });
  }, []);

  const handleCloseDialog = useCallback(() => setDialogPoint(null), []);

  const handleClosePulse = useCallback(() => setPulsePoint(null), []);

  const handleOpenDialogFromPulse = useCallback(() => {
    if (pulsePoint) {
      setDialogPoint(pulsePoint);
      setPulsePoint(null);
    }
  }, [pulsePoint]);

  const handlePerceptionSubmitted = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["persepsi"] });
  }, [queryClient]);

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
          setViewMode((mode) => (mode === "heatmap" ? "pin" : "heatmap"))
        }
      />

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <HomeMapControls
          query={query}
          onQueryChange={handleQueryChange}
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          onCategoryChange={setSelectedCategory}
          onStatusChange={setSelectedStatus}
          onReset={handleResetFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showDaysFilter
          days={days}
          onDaysChange={setDays}
          totalResults={filteredReports.length}
          isAdmin={isAdmin}
          searchResults={filteredReports.slice(0, 5)}
          onSelectSearchResult={handleSelectReport}
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
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/85 p-4 text-center backdrop-blur-sm anim-fade-in">
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
              onSwitchToPin={() => setViewMode("pin")}
              perceptions={perceptions}
              onMapClick={handleMapClick}
            />
          )}

          {!isLoading && !isError && viewMode !== "unseen" && filteredReports.length === 0 && (
            <div className="absolute left-1/2 top-[55%] z-20 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-outline-variant/60 bg-surface-lowest/95 p-4 text-center shadow-lg backdrop-blur anim-fade-up">
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

          {/* Lapisan naratif: pengantar + hitungan live + bukti penanganan */}
          {isIntroVisible ? (
            <aside
              aria-label="Tentang SigapKota"
              className="anim-fade-up absolute left-4 top-[7.25rem] z-20 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-outline-variant/50 bg-surface-lowest/95 p-5 shadow-[0_8px_30px_rgba(0,83,91,0.14)] backdrop-blur-md md:left-8 md:w-[24rem]"
            >
              <div className="flex items-start justify-between gap-3">
                <h1 className="font-heading text-xl font-bold leading-snug tracking-tight text-on-surface">
                  Lapor masalah kota, pantau penanganannya
                </h1>
                <button
                  type="button"
                  aria-label="Tutup pengantar"
                  onClick={dismissIntro}
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-outline transition-all duration-150 ease-out hover:bg-surface-container hover:text-primary active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                SigapKota mempertemukan warga dan pemerintah kota. Laporkan jalan rusak,
                sampah menumpuk, atau banjir di sekitar Anda, lalu ikuti proses
                penanganannya secara transparan sampai tuntas.
              </p>

              <dl className="anim-fade-up anim-delay-1 mt-4 grid grid-cols-3 divide-x divide-outline-variant/30 rounded-xl bg-surface-low py-3 text-center">
                <div className="px-1">
                  <dt className="text-xs text-outline">Dilaporkan</dt>
                  <dd className="font-heading text-xl font-bold text-on-surface">
                    {stats.reported}
                  </dd>
                </div>
                <div className="px-1">
                  <dt className="text-xs text-outline">Ditangani</dt>
                  <dd className="font-heading text-xl font-bold text-secondary">
                    {stats.inProgress}
                  </dd>
                </div>
                <div className="px-1">
                  <dt className="text-xs text-outline">Selesai</dt>
                  <dd className="font-heading text-xl font-bold text-tertiary">
                    {stats.done}
                  </dd>
                </div>
              </dl>

              {resolvedReport && (
                <Link
                  href={`/laporan/${resolvedReport.id}`}
                  className="anim-fade-up anim-delay-2 group mt-4 block rounded-xl border border-outline-variant/40 bg-surface-lowest p-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tertiary">
                    Baru saja diselesaikan
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <figure className="space-y-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolvedReport.photo_url}
                        alt={`Kondisi sebelum penanganan: ${resolvedReport.title}`}
                        className="aspect-[4/3] w-full rounded-lg object-cover"
                      />
                      <figcaption className="text-xs text-outline">Sebelum</figcaption>
                    </figure>
                    <figure className="space-y-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolvedReport.photo_after_url}
                        alt={`Kondisi sesudah penanganan: ${resolvedReport.title}`}
                        className="aspect-[4/3] w-full rounded-lg object-cover"
                      />
                      <figcaption className="text-xs text-outline">Sesudah</figcaption>
                    </figure>
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-on-surface group-hover:text-primary">
                    {resolvedReport.title}
                  </p>
                </Link>
              )}

              <Link
                href="/laporan/baru"
                className="anim-fade-up anim-delay-3 mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground shadow-[0_4px_16px_rgba(142,78,20,0.22)] transition-colors duration-150 hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Plus className="h-4 w-4" />
                Lapor Masalah
              </Link>
            </aside>
          ) : (
            !isLoading &&
            !isError &&
            viewMode === "pin" && (
              <button
                type="button"
                onClick={reopenIntro}
                className="absolute left-4 top-[7.25rem] z-20 flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-outline-variant/60 bg-surface-lowest/95 px-3 text-xs font-medium text-on-surface-variant shadow-sm backdrop-blur-md transition-all duration-150 ease-out hover:bg-surface-container hover:text-primary active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:left-8"
              >
                <Info className="h-3.5 w-3.5" />
                Tentang SigapKota
              </button>
            )
          )}

          {/* Legenda warna pin (hanya relevan pada mode pin) */}
          {!isLoading && !isError && viewMode === "pin" && <MapLegend />}

          {/* Mode unseen: legenda persepsi + status muat/kosong */}
          {!isLoading && !isError && viewMode === "unseen" && (
            <div className="absolute right-4 top-[7.25rem] z-20 rounded-xl border border-outline-variant/50 bg-surface-lowest/95 p-3 shadow-[0_8px_30px_rgba(0,83,91,0.12)] backdrop-blur-md md:right-8">
              <p className="mb-2 text-xs font-semibold text-on-surface">Persepsi Warga</p>
              <ul className="space-y-1.5">
                {PERCEPTION_SENTIMENTS.map((sentiment: PerceptionSentiment) => (
                  <li
                    key={sentiment}
                    className="flex items-center gap-2 text-xs text-on-surface-variant"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: PERCEPTION_SENTIMENT_COLORS[sentiment] }}
                    />
                    {PERCEPTION_SENTIMENT_LABELS[sentiment].label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isLoading && !isError && viewMode === "unseen" && perceptionsLoading && (
            <div className="absolute left-1/2 top-[55%] z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-outline-variant/60 bg-surface-lowest/95 px-4 py-2 text-xs text-on-surface-variant shadow-sm backdrop-blur-md">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Memuat persepsi...
            </div>
          )}

          {!isLoading &&
            !isError &&
            viewMode === "unseen" &&
            !perceptionsLoading &&
            !perceptionsError &&
            perceptions.length === 0 && (
              <div className="absolute left-1/2 top-[55%] z-20 w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 rounded-xl border border-outline-variant/50 bg-surface-lowest/95 p-3 text-center text-xs text-outline shadow-sm backdrop-blur-md">
                Belum ada persepsi di area ini.
              </div>
            )}

          {/* Ringkasan pulse di sekitar titik yang diketuk pengguna */}
          {!isLoading && !isError && viewMode === "unseen" && pulsePoint && (
            <div className="absolute bottom-5 left-4 z-30 md:bottom-8 md:left-8">
              <AreaPulsePopup
                perceptions={perceptions}
                reports={filteredReports}
                latitude={pulsePoint.lat}
                longitude={pulsePoint.lng}
                onOpenDialog={handleOpenDialogFromPulse}
                onClose={handleClosePulse}
              />
            </div>
          )}

          <Link
            href="/laporan/baru"
            aria-label="Buat Laporan"
            className="absolute bottom-5 right-4 z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-[0_8px_24px_rgba(142,78,20,0.28)] transition-all duration-150 ease-out hover:bg-secondary/90 active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:bottom-8 md:right-8 md:h-16 md:w-16"
          >
            <Plus className="h-7 w-7" strokeWidth={2.2} />
          </Link>

          {visibleSelectedReport && (
            <div className="anim-fade-up absolute bottom-5 left-4 right-[5.25rem] z-30 max-w-md md:bottom-8 md:left-8 md:right-auto md:w-[28rem]">
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
                    <span className="max-w-[55%] truncate rounded-full bg-tertiary/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-tertiary">
                      {CATEGORY_LABELS[visibleSelectedReport.category]}
                    </span>
                    <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs font-medium text-outline">
                      <span className={`h-2 w-2 rounded-full ${statusDotClass[visibleSelectedReport.status]}`} />
                      {STATUS_LABELS[visibleSelectedReport.status]}
                    </span>
                  </div>
                  <Link
                    href={`/laporan/${visibleSelectedReport.id}`}
                    className="block truncate text-sm font-semibold text-foreground transition-colors duration-150 ease-out hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {visibleSelectedReport.title}
                  </Link>
                  <div className="mt-2 flex items-center gap-4 text-xs text-outline">
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
                  className="absolute right-0 top-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-outline transition-all duration-150 ease-out hover:bg-surface-container hover:text-primary active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <PerceptionDialog
          open={dialogPoint !== null}
          onOpenChange={(open) => {
            if (!open) handleCloseDialog();
          }}
          latitude={dialogPoint?.lat ?? DEFAULT_CENTER[0]}
          longitude={dialogPoint?.lng ?? DEFAULT_CENTER[1]}
          onSubmitted={handlePerceptionSubmitted}
        />
      </main>
    </div>
  );
}
