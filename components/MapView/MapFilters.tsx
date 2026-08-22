"use client";

import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/constants/reports";
import type { ReportCategory, ReportStatus } from "@/lib/types";
import { REPORT_CATEGORIES, REPORT_STATUSES } from "@/lib/constants/reports";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw, Flame, MapPin } from "lucide-react";

interface MapFiltersProps {
  selectedCategory: ReportCategory | "all";
  selectedStatus: ReportStatus | "all";
  onCategoryChange: (category: ReportCategory | "all") => void;
  onStatusChange: (status: ReportStatus | "all") => void;
  onReset: () => void;
  totalResults: number;
  totalAll: number;
  viewMode?: "marker" | "heatmap";
  onViewModeChange?: (mode: "marker" | "heatmap") => void;
}

export default function MapFilters({
  selectedCategory,
  selectedStatus,
  onCategoryChange,
  onStatusChange,
  onReset,
  totalResults,
  totalAll,
  viewMode = "marker",
  onViewModeChange,
}: MapFiltersProps) {
  const isFiltered = selectedCategory !== "all" || selectedStatus !== "all";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {/* View Mode Toggle (B08) */}
        {onViewModeChange && (
          <div className="flex items-center rounded-md border bg-muted p-0.5">
            <Button
              type="button"
              variant={viewMode === "heatmap" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2.5 text-xs gap-1"
              onClick={() => onViewModeChange("heatmap")}
            >
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              Heatmap
            </Button>
            <Button
              type="button"
              variant={viewMode === "marker" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2.5 text-xs gap-1"
              onClick={() => onViewModeChange("marker")}
            >
              <MapPin className="h-3.5 w-3.5" />
              Pin
            </Button>
          </div>
        )}

        {/* Category Filter */}
        <div className="w-[160px] sm:w-[180px]">
          <Select
            value={selectedCategory}
            onValueChange={(val) => onCategoryChange(val as ReportCategory | "all")}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {REPORT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-[140px] sm:w-[160px]">
          <Select
            value={selectedStatus}
            onValueChange={(val) => onStatusChange(val as ReportStatus | "all")}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {REPORT_STATUSES.map((st) => (
                <SelectItem key={st} value={st}>
                  {STATUS_LABELS[st]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear filter button */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Reset Filter
          </Button>
        )}
      </div>

      {/* Result counter badge */}
      <div className="text-xs text-muted-foreground">
        Menampilkan <span className="font-semibold text-foreground">{totalResults}</span> dari {totalAll} laporan
      </div>
    </div>
  );
}
