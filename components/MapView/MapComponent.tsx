"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

import { OPENSTREETMAP_ATTRIBUTION, OPENSTREETMAP_TILE_URL } from "@/lib/constants/map";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  STATUS_BADGE_VARIANTS,
  STATUS_LABELS,
} from "@/lib/constants/reports";
import type { Report } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

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

  useEffect(() => {
    if (!map) return;

    // Convert reports to [lat, lng, intensity]
    const points: [number, number, number][] = reports.map((r) => [
      r.latitude,
      r.longitude,
      Math.min(1.0, 0.4 + (r.vote_count || 1) * 0.1), // higher votes = higher intensity
    ]);

    // @ts-expect-error leaflet.heat attaches heatLayer to L
    const heatLayer = L.heatLayer(points, {
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
function createCustomIcon(category: Report["category"], isSelected: boolean) {
  const color = CATEGORY_COLORS[category] || "#6b7280";
  const size = isSelected ? 36 : 28;

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
      ${isSelected ? "transform: scale(1.2); z-index: 999;" : ""}
    ">
      <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-leaflet-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
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
    <div className="relative h-full w-full overflow-hidden rounded-lg border shadow-sm">
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
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
            const icon = createCustomIcon(report.category, isSelected);

            return (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectReport?.(report),
                }}
              >
                <Popup className="sigapkota-popup">
                  <div className="w-64 space-y-2 p-1">
                    {report.photo_url && (
                      <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={report.photo_url}
                          alt={report.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {CATEGORY_LABELS[report.category]}
                      </Badge>
                      <Badge
                        variant={STATUS_BADGE_VARIANTS[report.status]}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {STATUS_LABELS[report.status]}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-semibold leading-tight text-foreground line-clamp-2">
                      {report.title}
                    </h4>

                    {report.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {report.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground border-t">
                      <span>{report.vote_count ?? 0} Dukungan</span>
                      <Link
                        href={`/laporan/${report.id}`}
                        className="inline-flex h-7 items-center gap-0.5 rounded-md bg-secondary px-2.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Lihat Detail
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        )}
      </MapContainer>
    </div>
  );
}
