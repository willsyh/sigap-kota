"use client";

import { useMemo } from "react";

import {
  PERCEPTION_SENTIMENTS,
  PERCEPTION_SENTIMENT_COLORS,
  PERCEPTION_SENTIMENT_LABELS,
} from "@/lib/constants/perceptions";

export interface PerceptionPoint {
  id: string;
  latitude: number;
  longitude: number;
  sentiment: "nyaman" | "biasa" | "tidak_nyaman";
  reason: string | null;
  report_id: string | null;
  created_at: string;
}

export type PerceptionSentiment = PerceptionPoint["sentiment"];

// Radius analisis pulse di sekitar titik yang diketuk pengguna.
const PULSE_RADIUS_METERS = 300;

// Jumlah respons minimum sebelum persentase dianggap bermakna.
const MIN_RESPONSES_FOR_PERCENTAGE = 5;

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface PerceptionPulseCardProps {
  perceptions: PerceptionPoint[];
  latitude: number;
  longitude: number;
}

export default function PerceptionPulseCard({
  perceptions,
  latitude,
  longitude,
}: PerceptionPulseCardProps) {
  const { total, counts } = useMemo(() => {
    const result: Record<PerceptionSentiment, number> = {
      nyaman: 0,
      biasa: 0,
      tidak_nyaman: 0,
    };
    let count = 0;
    for (const point of perceptions) {
      if (
        haversineMeters(latitude, longitude, point.latitude, point.longitude) <=
        PULSE_RADIUS_METERS
      ) {
        result[point.sentiment] += 1;
        count += 1;
      }
    }
    return { total: count, counts: result };
  }, [perceptions, latitude, longitude]);

  const enoughResponses = total >= MIN_RESPONSES_FOR_PERCENTAGE;

  return (
    <div className="w-full max-w-xs rounded-xl border border-outline-variant/50 bg-surface-lowest/95 p-4 shadow-[0_8px_30px_rgba(0,83,91,0.14)] backdrop-blur-md">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-heading text-sm font-bold text-on-surface">
          Unseen Pulse
        </h3>
        <span className="text-xs tabular-nums text-outline">
          radius 300 m
        </span>
      </div>

      <p className="mt-1 text-xs text-on-surface-variant">
        <span className="font-semibold tabular-nums text-on-surface">{total}</span>{" "}
        respons dalam area ini
      </p>

      {!enoughResponses ? (
        <p className="mt-3 rounded-lg bg-surface-low px-3 py-2 text-xs leading-relaxed text-outline">
          Belum cukup respons untuk melihat pola.
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {PERCEPTION_SENTIMENTS.map((sentiment) => {
            const percentage = total > 0 ? (counts[sentiment] / total) * 100 : 0;
            return (
              <li key={sentiment}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5 text-on-surface-variant">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: PERCEPTION_SENTIMENT_COLORS[sentiment] }}
                    />
                    {PERCEPTION_SENTIMENT_LABELS[sentiment].label}
                  </span>
                  <span className="tabular-nums text-outline">
                    {Math.round(percentage)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: PERCEPTION_SENTIMENT_COLORS[sentiment],
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
