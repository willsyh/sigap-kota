"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import { OPENSTREETMAP_ATTRIBUTION, OPENSTREETMAP_TILE_URL } from "@/lib/constants/map";
import { PERCEPTION_SENTIMENT_COLORS } from "@/lib/constants/perceptions";
import type { Report } from "@/lib/types";
import type { PerceptionPoint } from "@/components/perceptions/PerceptionPulseCard";

// leaflet.heat menempel plugin ke global window.L, sedangkan build ESM
// Leaflet tidak membuat global tersebut. Daftarkan sebelum plugin dimuat.
if (typeof window !== "undefined") {
  const w = window as unknown as { L?: unknown };
  if (!w.L) w.L = L;
}

// Beri tahu komponen saat plugin selesai dimuat agar layer heatmap dirender ulang.
const heatReadyListeners = new Set<() => void>();
let heatReady = false;
void import("leaflet.heat").then(() => {
  heatReady = true;
  heatReadyListeners.forEach((notify) => notify());
});

interface MapComponentProps {
  reports: Report[];
  selectedReportId?: string | null;
  onSelectReport?: (report: Report) => void;
  center?: [number, number];
  zoom?: number;
  viewMode?: "pin" | "heatmap" | "unseen";
  onSwitchToPin?: () => void;
  perceptions?: PerceptionPoint[];
  onMapClick?: (lat: number, lng: number) => void;
}

// Heatmap interaction cap: clicks zoom in by up to two steps and never past
// this zoom; reaching it hands control over to the marker view.
const HEATMAP_MAX_ZOOM = 16;

// B08: Heatmap Layer Component using leaflet.heat with click-to-zoom.
// Klik di area heatmap hanya melakukan flyTo zoom-in (predictable), TIDAK
// mengubah viewMode. Transisi antar mode sepenuhnya diatur dari navbar.
function HeatmapLayer({
  reports,
  onSelectReport,
  onSwitchToPin,
}: {
  reports: Report[];
  onSelectReport?: (report: Report) => void;
  onSwitchToPin?: () => void;
}) {
  const map = useMap();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (heatReady) return;
    const notify = () => forceUpdate((n) => n + 1);
    heatReadyListeners.add(notify);
    return () => { heatReadyListeners.delete(notify); };
  }, []);

  useEffect(() => {
    if (!map || !heatReady) return;

    // Guard jika plugin belum selesai dimuat
    const heatFactory = (L as unknown as { heatLayer?: unknown }).heatLayer;
    if (typeof heatFactory !== "function") return;

    // Bobot dasar per laporan; dengan max=4, satu titik (w~0.8) hanya
    // menyentuh bagian bawah gradient. Warna pekat baru muncul saat
    // beberapa laporan menumpuk di lokasi yang sama.
    const points: [number, number, number][] = reports.map((r) => [
      r.latitude,
      r.longitude,
      Math.min(1.5, 0.8 + (r.vote_count || 0) * 0.05),
    ]);

    type HeatLayerInstance = L.Layer & {
      setOptions: (opts: Record<string, unknown>) => unknown;
      redraw: () => void;
    };

    const heatLayer = (L as unknown as { heatLayer: (pts: [number, number, number][], opts: Record<string, unknown>) => HeatLayerInstance })
      .heatLayer(points, {
        radius: 45,
        blur: 22,
        maxZoom: Math.min(map.getZoom() + 5, HEATMAP_MAX_ZOOM),
        minOpacity: 0.35,
        max: 4.0,
        gradient: {
          0.15: "#14b8a6",
          0.4: "#eab308",
          0.7: "#f97316",
          1.0: "#dc2626",
        },
      });

    heatLayer.addTo(map);

    // Cap falloff moderat: titik tetap terlihat di zoom kota/provinsi,
    // tapi meredup natural kalau zoom out sejauh dunia/benua.
    const syncIntensity = () => {
      heatLayer.setOptions({ maxZoom: Math.min(map.getZoom() + 5, HEATMAP_MAX_ZOOM) });
      heatLayer.redraw();
    };

    map.on("zoomend", syncIntensity);
    map.on("moveend", syncIntensity);

    // Cari laporan terdekat dari suatu titik (euclidean lat/lng cukup untuk
    // memilih laporan saat zoom detail; semua laporan dalam radius dekat).
    const nearestReport = (lat: number, lng: number): Report | undefined => {
      let best: Report | undefined;
      let bestDist = Infinity;
      for (const r of reports) {
        const d = (r.latitude - lat) ** 2 + (r.longitude - lng) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = r;
        }
      }
      return best;
    };

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const currentZoom = map.getZoom();
      // Sudah di zoom maksimal: buka laporan terdekat lalu pindah ke mode Pin
      // agar user langsung melihat pin & detail laporan di titik tersebut.
      if (currentZoom >= HEATMAP_MAX_ZOOM) {
        const nearest = nearestReport(e.latlng.lat, e.latlng.lng);
        if (nearest) onSelectReport?.(nearest);
        onSwitchToPin?.();
        return;
      }
      // Masih bisa zoom: perbesar bertahap ke arah titik yang diklik.
      const newZoom = Math.min(currentZoom + 2, HEATMAP_MAX_ZOOM);
      map.flyTo(e.latlng, newZoom, { animate: true });
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
      map.off("zoomend", syncIntensity);
      map.off("moveend", syncIntensity);
      map.removeLayer(heatLayer);
    };
  }, [map, reports, onSelectReport, onSwitchToPin]);

  return null;
}

// Pin Layer: render satu marker biasa per laporan, TANPA agregasi/density
// dari heatmap. Koordinat diambil LANGSUNG dari data asli reports.
function PinLayer({
  reports,
  selectedReportId,
  onSelectReport,
}: {
  reports: Report[];
  selectedReportId?: string | null;
  onSelectReport?: (report: Report) => void;
}) {
  return (
    <>
      {reports.map((report) => {
        const isSelected = report.id === selectedReportId;
        const icon = getReportIcon(report.status, report.category, isSelected);

        return (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={icon}
            title={report.title}
            eventHandlers={{
              click: () => onSelectReport?.(report),
            }}
          />
        );
      })}
    </>
  );
}

// Unseen Layer: titik persepsi warga di mode "unseen". Klik pada peta
// membuka dialog persepsi; klik pada titik persepsi tidak diteruskan ke peta.
function UnseenLayer({
  perceptions,
  onMapClick,
}: {
  perceptions: PerceptionPoint[];
  onMapClick?: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  // Kursor crosshair menandakan peta siap menerima ketukan.
  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor = "crosshair";
    return () => {
      container.style.cursor = "";
    };
  }, [map]);

  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, onMapClick]);

  return (
    <>
      {perceptions.map((point) => (
        <CircleMarker
          key={point.id}
          center={[point.latitude, point.longitude]}
          radius={7}
          pathOptions={{
            color: "#f8fafc",
            weight: 1.5,
            fillColor: PERCEPTION_SENTIMENT_COLORS[point.sentiment],
            fillOpacity: 0.75,
          }}
          bubblingMouseEvents={false}
          eventHandlers={{
            click: (e: L.LeafletMouseEvent) => {
              L.DomEvent.stopPropagation(e.originalEvent);
            },
          }}
        />
      ))}
    </>
  );
}

// Center view controller.
//
// The map must fly ONLY when a report becomes selected or the selection moves
// to a different report. Deselection and view-mode switches keep the current
// viewport, so a heatmap flight is never cancelled by an accompanying
// re-render. The previously-selected id is tracked in a ref so correctness
// does not depend on prop identity (fresh array literals are fine).
function MapViewController({
  center,
  zoom,
  selectedReportId,
}: {
  center: [number, number];
  zoom: number;
  selectedReportId?: string | null;
}) {
  const map = useMap();
  const prevSelectedIdRef = useRef<string | null | undefined>(selectedReportId);

  useEffect(() => {
    const previousId = prevSelectedIdRef.current;
    prevSelectedIdRef.current = selectedReportId;

    // No transition yet (initial mount) or selection was cleared: keep viewport.
    if (selectedReportId == null || selectedReportId === previousId) return;

    // Actual selection transition: fly to the newly selected report.
    map.flyTo(center, zoom, { animate: true });
  }, [center, zoom, selectedReportId, map]);

  return null;
}

// Helper to create status-colored HTML markers.
// Semantic colors per DESIGN.md: dilaporkan = neutral gray,
// diproses/menunggu_konfirmasi = amber, selesai = green.
// Each pin carries a category glyph (Lucide path data) so reports are
// recognizable by shape as well as color.
const CATEGORY_GLYPHS: Record<Report["category"], string> = {
  jalan_rusak:
    '<rect x="2" y="6" width="20" height="8" rx="1"/><path d="M17 14v7"/><path d="M7 14v7"/><path d="M17 3v3"/><path d="M7 3v3"/><path d="M10 14 2.3 6.3"/><path d="m14 6 7.7 7.7"/><path d="m8 6 8 8"/>',
  sampah:
    '<path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  banjir:
    '<path d="M2 12q2.5 2 5 0t5 0 5 0 5 0"/><path d="M2 19q2.5 2 5 0t5 0 5 0 5 0"/><path d="M2 5q2.5 2 5 0t5 0 5 0 5 0"/>',
  fasilitas_umum:
    '<path d="M10 18v-7"/><path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/>',
  lainnya:
    '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
};

function createCustomIcon(
  status: Report["status"],
  category: Report["category"],
  isSelected: boolean,
) {
  const colorByStatus: Record<Report["status"], string> = {
    dilaporkan: "#6f797a",
    diproses: "#d97706",
    menunggu_konfirmasi: "#b45309",
    selesai: "#15803d",
  };
  const color = colorByStatus[status];
  const size = isSelected ? 42 : 34;
  const glyphSize = isSelected ? 16 : 13;

  const glyph = `<svg viewBox="0 0 24 24" width="${glyphSize}" height="${glyphSize}" fill="none" stroke="#ffffff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CATEGORY_GLYPHS[category]}</svg>`;

  const html = `
    <div style="position:relative;width:${size}px;height:${size + 8}px;filter:drop-shadow(0 4px 5px rgba(17,28,44,.24));">
      <div style="
        position:absolute;
        left:50%;
        bottom:3px;
        width:14px;
        height:14px;
        background:${color};
        transform:translateX(-50%) rotate(45deg);
        border-radius:2px;
      "></div>
      <div style="
        position:relative;
        z-index:1;
        width:${size}px;
        height:${size}px;
        display:flex;
        align-items:center;
        justify-content:center;
        border:3px solid white;
        border-radius:9999px;
        background:${color};
        box-shadow:0 2px 6px rgba(17,28,44,.2);
      ">
        ${glyph}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-leaflet-marker",
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
  });
}

// Cache ikon berdasarkan (status|category|isSelected) supaya identitas objek
// stabil antar-render. Tanpa ini, setiap render membuat divIcon baru yang
// memicu Leaflet setIcon() dan bisa membuat pin berkedip/bergoyang.
const reportIconCache = new Map<string, L.DivIcon>();
function getReportIcon(
  status: Report["status"],
  category: Report["category"],
  isSelected: boolean,
) {
  const key = `${status}|${category}|${isSelected}`;
  let icon = reportIconCache.get(key);
  if (!icon) {
    icon = createCustomIcon(status, category, isSelected);
    reportIconCache.set(key, icon);
  }
  return icon;
}

export default function MapComponent({
  reports,
  selectedReportId,
  onSelectReport,
  center = [-6.3458, 106.7394], // Pamulang default
  zoom = 13,
  viewMode = "pin",
  onSwitchToPin,
  perceptions = [],
  onMapClick,
}: MapComponentProps) {
  const defaultCenter: [number, number] = useMemo(() => center, [center]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution={OPENSTREETMAP_ATTRIBUTION}
          url={OPENSTREETMAP_TILE_URL}
          maxZoom={19}
        />

        <MapViewController center={center} zoom={zoom} selectedReportId={selectedReportId} />

        {viewMode === "heatmap" ? (
          <HeatmapLayer
            reports={reports}
            onSelectReport={onSelectReport}
            onSwitchToPin={onSwitchToPin}
          />
        ) : viewMode === "unseen" ? (
          <UnseenLayer perceptions={perceptions} onMapClick={onMapClick} />
        ) : (
          <PinLayer
            reports={reports}
            selectedReportId={selectedReportId}
            onSelectReport={onSelectReport}
          />
        )}
      </MapContainer>
    </div>
  );
}
