"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import { OPENSTREETMAP_ATTRIBUTION, OPENSTREETMAP_TILE_URL } from "@/lib/constants/map";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  STATUS_BADGE_VARIANTS,
  STATUS_LABELS,
} from "@/lib/dummy-reports";
import type { Report } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MapComponentProps {
  reports: Report[];
  selectedReportId?: string | null;
  onSelectReport?: (report: Report) => void;
  center?: [number, number];
  zoom?: number;
}

// Center view controller
function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);

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

        <MapViewController center={center} zoom={zoom} />

        {reports.map((report) => {
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
                      {/* Using standard img for Leaflet popup compatibility */}
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
                    <span>{report.vote_count} Dukungan</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs px-2"
                      onClick={() => onSelectReport?.(report)}
                    >
                      Lihat Detail
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
