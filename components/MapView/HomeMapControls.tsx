"use client";

import { useState } from "react";
import { Filter, Flame, MapPin, RotateCcw, Search, X } from "lucide-react";

import { CATEGORY_LABELS, REPORT_CATEGORIES, REPORT_STATUSES, STATUS_LABELS } from "@/lib/constants/reports";
import type { ReportCategory, ReportStatus } from "@/lib/types";
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
  viewMode: "marker" | "heatmap";
  onViewModeChange: (mode: "marker" | "heatmap") => void;
  totalResults: number;
  isAdmin: boolean;
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
  totalResults,
  isAdmin,
}: HomeMapControlsProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasFilters = selectedCategory !== "all" || selectedStatus !== "all";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
      <div className="pointer-events-auto border-b border-outline-variant/40 bg-surface/88 px-4 py-3 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Cari wilayah, judul, atau ID laporan</span>
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline-variant"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Cari judul atau ID..."
              className="h-11 w-full rounded-xl border border-outline-variant bg-surface-lowest pl-10 pr-9 text-sm text-foreground shadow-none outline-none transition-colors placeholder:text-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/15"
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
          </label>

          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              aria-expanded={filtersOpen}
              aria-controls="home-map-filter-panel"
              onClick={() => setFiltersOpen((open) => !open)}
              className={cn(
                "relative h-11 cursor-pointer gap-2 rounded-xl border-outline-variant bg-surface-lowest px-3 text-sm font-medium shadow-none hover:bg-surface-container sm:px-4",
                filtersOpen && "border-primary bg-primary/5 text-primary",
              )}
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
              {hasFilters && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-secondary" />
              )}
            </Button>
          )}

          {/* Segmented control: Heatmap | Pin */}
          <div className="flex h-11 shrink-0 items-center rounded-xl border border-outline-variant bg-surface-lowest p-1 shadow-none" role="group" aria-label="Mode tampilan peta">
            <button
              type="button"
              onClick={() => onViewModeChange("heatmap")}
              aria-pressed={viewMode === "heatmap"}
              className={`flex h-full cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${viewMode === "heatmap" ? "bg-primary text-primary-foreground shadow-sm" : "text-on-surface-variant hover:text-primary"}`}
            >
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">Heatmap</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("marker")}
              aria-pressed={viewMode === "marker"}
              className={`flex h-full cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${viewMode === "marker" ? "bg-primary text-primary-foreground shadow-sm" : "text-on-surface-variant hover:text-primary"}`}
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Pin</span>
            </button>
          </div>
        </div>

        {isAdmin && filtersOpen && (
          <div
            id="home-map-filter-panel"
            className="mx-auto mt-3 grid max-w-3xl gap-3 rounded-2xl border border-outline-variant/70 bg-surface-lowest p-3 shadow-lg sm:grid-cols-[1fr_1fr_auto] sm:items-end"
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
  );
}
