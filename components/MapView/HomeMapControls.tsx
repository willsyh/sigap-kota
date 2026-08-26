"use client";

import { useState } from "react";
import { Filter, Flame, MapPin, RotateCcw, Search, X, Eye } from "lucide-react";

import { CATEGORY_LABELS, REPORT_CATEGORIES, REPORT_STATUSES, STATUS_LABELS } from "@/lib/constants/reports";
import type { Report, ReportCategory, ReportStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HomeMapControlsProps {
  query: string;
  onQueryChange: (query: string) => void;
  selectedCategory: ReportCategory | "all";
  selectedStatus: ReportStatus | "all";
  onCategoryChange: (category: ReportCategory | "all") => void;
  onStatusChange: (status: ReportStatus | "all") => void;
  onReset: () => void;
  viewMode: "pin" | "heatmap" | "unseen";
  onViewModeChange: (mode: "pin" | "heatmap" | "unseen") => void;
  showDaysFilter?: boolean;
  days?: 7 | 30;
  onDaysChange?: (days: 7 | 30) => void;
  totalResults: number;
  isAdmin: boolean;
  searchResults?: Report[];
  onSelectSearchResult?: (report: Report) => void;
}

export default function HomeMapControls({
  query,
  onQueryChange,
  selectedCategory,
  selectedStatus,
  onCategoryChange,
  onStatusChange,
  onReset,
  viewMode,
  onViewModeChange,
  showDaysFilter = false,
  days = 7,
  onDaysChange,
  totalResults,
  isAdmin,
  searchResults,
  onSelectSearchResult,
}: HomeMapControlsProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasFilters = selectedCategory !== "all" || selectedStatus !== "all";
  const showDropdown = query.trim().length > 0 && Array.isArray(searchResults);

  function handlePickResult(report: Report) {
    onSelectSearchResult?.(report);
    onQueryChange("");
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
      <div className="pointer-events-auto border-b border-outline-variant/40 bg-surface/88 px-4 py-3 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-3xl space-y-2">
          {/* Search with live result dropdown */}
          <label className="relative block min-w-0">
            <span className="sr-only">Cari judul atau kategori laporan</span>
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline-variant"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") onQueryChange("");
              }}
              placeholder="Cari judul atau kategori laporan"
              className="h-11 w-full rounded-xl border border-outline-variant bg-surface-lowest pl-10 pr-9 text-sm text-foreground shadow-none outline-none transition-colors duration-150 ease-out placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                aria-label="Hapus pencarian"
                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-outline transition-colors hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {showDropdown && (
              <div
                role="listbox"
                aria-label="Hasil pencarian laporan"
                className="anim-scale-in absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-lowest shadow-[0_8px_30px_rgba(0,83,91,0.14)]"
              >
                {searchResults!.length === 0 ? (
                  <p className="px-3 py-2.5 text-xs text-outline">
                    Tidak ada laporan yang cocok dengan pencarian.
                  </p>
                ) : (
                  searchResults!.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => handlePickResult(report)}
                      className="flex w-full cursor-pointer items-start gap-2 border-b border-outline-variant/25 px-3 py-2 text-left last:border-b-0 transition-colors duration-150 ease-out hover:bg-surface-container focus-visible:bg-surface-container focus-visible:outline-none"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-on-surface">
                          {report.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-outline">
                          {CATEGORY_LABELS[report.category]} &middot;{" "}
                          {STATUS_LABELS[report.status]}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </label>

          {/* Secondary toolbar: result count for everyone, demoted map-mode toggle */}
          <div className="flex items-center gap-2">
            <p
              className="text-xs font-medium text-on-surface-variant"
              role="status"
            >
              {totalResults} laporan cocok
            </p>

            {isAdmin && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-expanded={filtersOpen}
                aria-controls="home-map-filter-panel"
                onClick={() => setFiltersOpen((open) => !open)}
                className={cn(
                  "relative h-8 cursor-pointer gap-1.5 rounded-full border-outline-variant bg-surface-lowest px-3 text-xs font-medium shadow-none hover:bg-surface-container",
                  filtersOpen && "border-primary bg-primary/5 text-primary",
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
                {hasFilters && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-secondary" />
                )}
              </Button>
            )}

            <button
              type="button"
              aria-pressed={viewMode === "pin"}
              onClick={() => onViewModeChange("pin")}
              className={cn(
                "ml-auto flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                viewMode === "pin"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-outline-variant/70 bg-surface-lowest/90 text-on-surface-variant hover:border-outline-variant hover:text-primary",
              )}
            >
              <MapPin className="h-3.5 w-3.5" />
              Pin
            </button>

            <button
              type="button"
              aria-pressed={viewMode === "heatmap"}
              onClick={() =>
                onViewModeChange(viewMode === "heatmap" ? "pin" : "heatmap")
              }
              className={cn(
                "flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                viewMode === "heatmap"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-outline-variant/70 bg-surface-lowest/90 text-on-surface-variant hover:border-outline-variant hover:text-primary",
              )}
            >
              <Flame className="h-3.5 w-3.5" />
              Zona Padat
            </button>

            <button
              type="button"
              aria-pressed={viewMode === "unseen"}
              onClick={() =>
                onViewModeChange(viewMode === "unseen" ? "pin" : "unseen")
              }
              className={cn(
                "flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                viewMode === "unseen"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-outline-variant/70 bg-surface-lowest/90 text-on-surface-variant hover:border-outline-variant hover:text-primary",
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Unseen
            </button>
          </div>

          {viewMode === "heatmap" && (
            <p className="text-xs text-outline">
              Klik titik padat untuk melihat laporan.
            </p>
          )}

          {viewMode === "unseen" && (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-outline">
                Ketuk lokasi di peta untuk memberi persepsi.
              </p>
              {showDaysFilter && (
                <div className="ml-auto flex items-center gap-1">
                  {([7, 30] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={days === option}
                      onClick={() => onDaysChange?.(option)}
                      className={cn(
                        "flex h-7 shrink-0 cursor-pointer items-center rounded-full border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        days === option
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-outline-variant/70 bg-surface-lowest/90 text-on-surface-variant hover:border-outline-variant hover:text-primary",
                      )}
                    >
                      {option} hari
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isAdmin && filtersOpen && (
            <div
              id="home-map-filter-panel"
              className="anim-scale-in grid gap-3 rounded-2xl border border-outline-variant/70 bg-surface-lowest p-3 shadow-lg sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-outline">Kategori</label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => onCategoryChange(value as ReportCategory | "all")}
                >
                  <SelectTrigger className="h-11 w-full rounded-lg text-sm">
                    <SelectValue placeholder="Semua kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua kategori</SelectItem>
                    {REPORT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {CATEGORY_LABELS[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-outline">Status</label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => onStatusChange(value as ReportStatus | "all")}
                >
                  <SelectTrigger className="h-11 w-full rounded-lg text-sm">
                    <SelectValue placeholder="Semua status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua status</SelectItem>
                    {REPORT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={onReset}
                disabled={!hasFilters}
                className="h-11 cursor-pointer gap-2 text-xs text-outline hover:text-primary disabled:cursor-default"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>

              <p className="text-xs text-outline sm:col-span-3">
                {totalResults} laporan sesuai pencarian dan filter
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
