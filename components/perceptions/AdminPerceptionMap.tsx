"use client";

import { useEffect, useRef } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import { OPENSTREETMAP_ATTRIBUTION, OPENSTREETMAP_TILE_URL } from "@/lib/constants/map";
import { PERCEPTION_SENTIMENT_COLORS } from "@/lib/constants/perceptions";
import type { PerceptionSentiment } from "@/lib/supabase/types";

export interface AdminPerceptionPoint {
  id: string;
  latitude: number;
  longitude: number;
  sentiment: PerceptionSentiment;
}

// Fit the viewport to the point set when it changes. Previous ids are tracked
// in a ref so refitting only happens on an actual set change, not on unrelated
// re-renders (fresh array literals are fine).
function FitBounds({ points }: { points: AdminPerceptionPoint[] }) {
  const map = useMap();
  const prevIdsRef = useRef("");

  useEffect(() => {
    const ids = points.map((point) => point.id).join(",");
    if (ids === prevIdsRef.current) return;
    prevIdsRef.current = ids;

    if (points.length === 0) return;

    map.fitBounds(
      L.latLngBounds(points.map((point) => [point.latitude, point.longitude])),
      { padding: [40, 40], maxZoom: 15 },
    );
  }, [map, points]);

  return null;
}

export default function AdminPerceptionMap({
  points,
}: {
  points: AdminPerceptionPoint[];
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer
        center={[-6.3458, 106.7394]}
        zoom={13}
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
        <FitBounds points={points} />
        {points.map((point) => (
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
          />
        ))}
      </MapContainer>
    </div>
  );
}