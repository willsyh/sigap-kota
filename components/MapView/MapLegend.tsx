"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";

import { REPORT_STATUSES, STATUS_META } from "@/lib/constants/reports";
import {
  PERCEPTION_SENTIMENTS,
  PERCEPTION_SENTIMENT_COLORS,
  PERCEPTION_SENTIMENT_LABELS,
} from "@/lib/constants/perceptions";
import type { PerceptionSentiment } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface MapLegendProps {
  viewMode?: "pin" | "heatmap" | "unseen";
}

const PIN_LEGEND_ITEMS = REPORT_STATUSES.map((status) => ({
  label: STATUS_META[status].label,
  dotClass: STATUS_META[status].dotClassName,
}));

const MODE_LABELS: Record<"pin" | "heatmap" | "unseen", string> = {
  pin: "Status",
  heatmap: "Densitas",
  unseen: "Sentimen",
};

// Crossfade dua arah antara chip dan kartu: kedua state dirender bertumpuk
// dalam container relative yang ukurannya ditentukan chip. Transisi hanya
// opacity + scale (properti individual, GPU-composited) - tanpa animasi
// height/width. State non-aktif tetap ter-mount namun tidak bisa diklik
// (pointer-events-none), tidak bisa difokuskan (tabIndex -1), dan disembunyikan
// dari screen reader (aria-hidden).
export default function MapLegend({ viewMode = "pin" }: MapLegendProps) {
  const [open, setOpen] = useState(false);

  const stateClasses = open
    ? "visible scale-100 opacity-100"
    : "pointer-events-none invisible scale-95 opacity-0";

  return (
    <div className="absolute right-4 top-[7.25rem] z-20 md:right-8">
      <div className="relative">
        {/* Chip pembuka: tetap menentukan ukuran container */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="map-legend-panel"
          tabIndex={open ? -1 : undefined}
          onClick={() => setOpen(true)}
          className={cn(
            "flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-outline-variant/60 bg-surface-lowest/95 px-3 text-xs font-medium text-on-surface-variant shadow-sm backdrop-blur-md transition-all duration-200 ease-out hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            stateClasses,
          )}
        >
          <MapPin className="h-3.5 w-3.5" />
          Legenda
        </button>

        {/* Kartu legenda: overlay absolut di atas posisi chip */}
        <div
          id="map-legend-panel"
          aria-label="Legenda Peta"
          aria-hidden={!open}
          className={cn(
            "absolute inset-x-0 top-0 w-max min-w-48 rounded-xl border border-outline-variant/50 bg-surface-lowest/95 p-3 shadow-[0_8px_30px_rgba(0,83,91,0.12)] backdrop-blur-md transition-all duration-200 ease-out",
            stateClasses,
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-on-surface">
              Legenda Peta · {MODE_LABELS[viewMode]}
            </p>
            <button
              type="button"
              aria-label="Tutup legenda"
              tabIndex={open ? undefined : -1}
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-outline transition-all duration-150 ease-out hover:bg-surface-container hover:text-primary active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {viewMode === "pin" && (
            <ul className="space-y-1.5">
              {PIN_LEGEND_ITEMS.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2 text-xs text-on-surface-variant"
                >
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dotClass}`}
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          )}

          {viewMode === "heatmap" && (
            <div className="space-y-1.5">
              <div
                className="h-2 w-full rounded-full"
                style={{
                  background:
                    "linear-gradient(to right, #14b8a6, #eab308, #f97316, #b91c1c)",
                }}
              />
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Rendah</span>
                <span>Tinggi</span>
              </div>
            </div>
          )}

          {viewMode === "unseen" && (
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
          )}
        </div>
      </div>
    </div>
  );
}
