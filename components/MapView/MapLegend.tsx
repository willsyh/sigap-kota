"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

// Warna harus konsisten dengan createCustomIcon di MapComponent.tsx:
// dilaporkan = abu netral, diproses/menunggu konfirmasi = amber, selesai = hijau.
const LEGEND_ITEMS = [
  { label: "Dilaporkan", dotClass: "bg-[#6f797a]" },
  { label: "Sedang ditangani", dotClass: "bg-[#d97706]" },
  { label: "Selesai", dotClass: "bg-[#15803d]" },
];

// Crossfade dua arah antara chip dan kartu: kedua state dirender bertumpuk
// dalam container relative yang ukurannya ditentukan chip. Transisi hanya
// opacity + scale (properti individual, GPU-composited) - tanpa animasi
// height/width. State non-aktif tetap ter-mount namun tidak bisa diklik
// (pointer-events-none), tidak bisa difokuskan (tabIndex -1), dan disembunyikan
// dari screen reader (aria-hidden).
export default function MapLegend() {
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
            <p className="text-xs font-semibold text-on-surface">Legenda Peta</p>
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
          <ul className="space-y-1.5">
            {LEGEND_ITEMS.map((item) => (
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
        </div>
      </div>
    </div>
  );
}
