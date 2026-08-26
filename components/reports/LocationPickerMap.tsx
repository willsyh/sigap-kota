"use client";

import { useEffect, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";

if (typeof window !== "undefined") {
  const w = window as unknown as { L?: unknown };
  if (!w.L) w.L = L;
}

import {
  OPENSTREETMAP_ATTRIBUTION,
  OPENSTREETMAP_TILE_URL,
} from "@/lib/constants/map";

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

const pickerIcon = typeof window !== "undefined" ? L.divIcon({
  html: `
    <div style="
      width: 30px;
      height: 30px;
      background-color: var(--primary);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
    ">
      <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
    </div>
  `,
  className: "custom-leaflet-marker",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
}) : null;

function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prevCoords = useRef({ lat, lng });
  const isUserAdjusting = useRef(false);

  useMapEvents({
    click() {
      isUserAdjusting.current = true;
    },
    dragstart() {
      isUserAdjusting.current = true;
    },
    movestart() {
      // Catch zoom changes or manual pans to prevent resets
      isUserAdjusting.current = true;
    }
  });

  useEffect(() => {
    if (prevCoords.current.lat !== lat || prevCoords.current.lng !== lng) {
      if (!isUserAdjusting.current) {
        map.setView([lat, lng]);
      }
      prevCoords.current = { lat, lng };
    }
    // Delay resetting user control state to clear events in the queue
    const timer = setTimeout(() => {
      isUserAdjusting.current = false;
    }, 50);
    return () => clearTimeout(timer);
  }, [lat, lng, map]);

  return null;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({
  lat,
  lng,
  onChange,
}: LocationPickerMapProps) {
  const markerRef = useRef<L.Marker | null>(null);

  return (
    <div className="h-full w-full overflow-hidden rounded-md border">
      <MapContainer
        center={[lat, lng] as LatLngExpression}
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution={OPENSTREETMAP_ATTRIBUTION}
          url={OPENSTREETMAP_TILE_URL}
          maxZoom={19}
        />
        <Recenter lat={lat} lng={lng} />
        <ClickHandler onChange={onChange} />
        <InvalidateOnResize />
        <Marker
          position={[lat, lng] as LatLngExpression}
          icon={pickerIcon || undefined}
          draggable={true}
          ref={markerRef}
          eventHandlers={{
            dragend() {
              const pos = markerRef.current?.getLatLng();
              if (pos) onChange(pos.lat, pos.lng);
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
