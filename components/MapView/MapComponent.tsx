"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import { OPENSTREETMAP_ATTRIBUTION, OPENSTREETMAP_TILE_URL } from "@/lib/constants/map";
import type { Report } from "@/lib/types";

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
  viewMode?: "marker" | "heatmap";
  onSwitchToMarker?: () => void;
}

// Heatmap interaction cap: clicks zoom in by up to two steps and never past
// this zoom; reaching it hands control over to the marker view.
const HEATMAP_MAX_ZOOM = 16;

// B08: Heatmap Layer Component using leaflet.heat with click-to-zoom
function HeatmapLayer({ reports, onSwitchToMarker }: { reports: Report[]; onSwitchToMarker?: () => void }) {
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

    // Convert reports to [lat, lng, intensity]
    const points: [number, number, number][] = reports.map((r) => [
      r.latitude,
      r.longitude,
      Math.min(1.0, 0.4 + (r.vote_count || 1) * 0.1), // higher votes = higher intensity
    ]);

    const heatLayer = (L as unknown as { heatLayer: (pts: [number, number, number][], opts: Record<string, unknown>) => L.Layer })
      .heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      // Civic Horizon ramp: teal for sparse activity, brand amber in the
      // middle, strong red at peak density.
      gradient: {
        0.2: "#0f766e",
        0.4: "#14b8a6",
        0.6: "#f59e0b",
        0.8: "#ea580c",
        1.0: "#dc2626",
      },
    });

    heatLayer.addTo(map);

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      // Zoom in toward the clicked hotspot, capped so the flight stays
      // readable; only once fully zoomed in do we hand over to pin view.
      // Never fly outward: if the user already hand-zoomed past the cap,
      // hand over to pin view without moving the viewport.
      const currentZoom = map.getZoom();
      if (currentZoom >= HEATMAP_MAX_ZOOM) {
        if (onSwitchToMarker) {
          onSwitchToMarker();
        }
        return;
      }
      const newZoom = Math.min(currentZoom + 2, HEATMAP_MAX_ZOOM);
      map.flyTo(e.latlng, newZoom, { animate: true });
      if (newZoom >= HEATMAP_MAX_ZOOM && onSwitchToMarker) {
        onSwitchToMarker();
      }
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
      map.removeLayer(heatLayer);
    };
  }, [map, reports, onSwitchToMarker]);

  return null;
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

// Helper to create category-colored HTML markers
function createCustomIcon(status: Report["status"], isSelected: boolean) {
  const colorByStatus: Record<Report["status"], string> = {
    dilaporkan: "#6f797a",
    diproses: "#8e4e14",
    menunggu_konfirmasi: "#b45309",
    selesai: "#01544f",
  };
  const color = colorByStatus[status];
  const size = isSelected ? 42 : 34;

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
        <div style="width:${isSelected ? 12 : 9}px;height:${isSelected ? 12 : 9}px;border:2px solid white;border-radius:9999px;"></div>
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

export default function MapComponent({
  reports,
  selectedReportId,
  onSelectReport,
  center = [-6.3458, 106.7394], // Pamulang default
  zoom = 13,
  viewMode = "marker",
  onSwitchToMarker,
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
          <HeatmapLayer reports={reports} onSwitchToMarker={onSwitchToMarker} />
        ) : (
          reports.map((report) => {
            const isSelected = report.id === selectedReportId;
            const icon = createCustomIcon(report.status, isSelected);

            return (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectReport?.(report),
                }}
              />
            );
          })
        )}
      </MapContainer>
    </div>
  );
}
