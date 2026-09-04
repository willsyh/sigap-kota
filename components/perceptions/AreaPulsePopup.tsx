"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapPin, Plus, TrendingDown, TrendingUp } from "lucide-react";

import {
  PERCEPTION_SENTIMENTS,
  PERCEPTION_SENTIMENT_COLORS,
  PERCEPTION_SENTIMENT_LABELS,
} from "@/lib/constants/perceptions";
import type { PerceptionPoint } from "@/components/perceptions/PerceptionPulseCard";
import type { Report } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/constants/reports";

const PULSE_RADIUS_METERS = 300;
const REPORT_RADIUS_METERS = 200;
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

interface AreaPulsePopupProps {
  perceptions: PerceptionPoint[];
  reports: Report[];
  latitude: number;
  longitude: number;
  onOpenDialog: () => void;
  onClose: () => void;
}

export default function AreaPulsePopup({
  perceptions,
  reports,
  latitude,
  longitude,
  onOpenDialog,
  onClose,
}: AreaPulsePopupProps) {
  const { total, counts, topReasons, nearbyReports } = useMemo(() => {
    const counts: Record<string, number> = {
      nyaman: 0,
      biasa: 0,
      tidak_nyaman: 0,
    };
    const reasonCounts: Record<string, number> = {};
    let total = 0;

    for (const point of perceptions) {
      if (
        haversineMeters(latitude, longitude, point.latitude, point.longitude) <=
        PULSE_RADIUS_METERS
      ) {
        counts[point.sentiment] += 1;
        total += 1;
        if (point.reason) {
          reasonCounts[point.reason] = (reasonCounts[point.reason] || 0) + 1;
        }
      }
    }

    const topReasons = Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([reason, count]) => ({ reason, count }));

    const nearbyReports = reports
      .filter(
        (r) =>
          haversineMeters(latitude, longitude, r.latitude, r.longitude) <=
          REPORT_RADIUS_METERS,
      )
      .slice(0, 3);

    return { total, counts, topReasons, nearbyReports };
  }, [perceptions, reports, latitude, longitude]);

  const enoughResponses = total >= MIN_RESPONSES_FOR_PERCENTAGE;

  const dominantSentiment = useMemo(() => {
    if (total === 0) return null;
    let best: string = "nyaman";
    let bestCount = 0;
    for (const s of PERCEPTION_SENTIMENTS) {
      if (counts[s] > bestCount) {
        bestCount = counts[s];
        best = s;
      }
    }
    return best;
  }, [counts, total]);

  const dominantMeta = dominantSentiment
    ? PERCEPTION_SENTIMENT_LABELS[dominantSentiment as keyof typeof PERCEPTION_SENTIMENT_LABELS]
    : undefined;
  const dominantColor = dominantSentiment
    ? PERCEPTION_SENTIMENT_COLORS[dominantSentiment as keyof typeof PERCEPTION_SENTIMENT_COLORS]
    : undefined;

  return (
    <div className="w-full max-w-xs rounded-2xl border border-outline-variant/50 bg-surface-lowest p-4 shadow-[0_8px_30px_rgba(0,83,91,0.18)] backdrop-blur-md anim-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-heading text-sm font-bold text-on-surface">
            Denyut Persepsi
          </h3>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            {total} respons dalam radius 300m
          </p>
        </div>
        {dominantMeta && (
          <span
            className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: dominantColor }}
          >
            {dominantSentiment === "nyaman" ? (
              <TrendingUp className="h-3 w-3" />
            ) : dominantSentiment === "tidak_nyaman" ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {dominantMeta.label}
          </span>
        )}
      </div>

      {/* Sentiment breakdown */}
      {!enoughResponses ? (
        <p className="mt-3 rounded-lg bg-surface-low px-3 py-2 text-xs leading-relaxed text-outline">
          Belum cukup respons untuk melihat pola.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
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
                    className="h-full rounded-full transition-[width] duration-500 ease-out"
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

      {/* Top reasons */}
      {enoughResponses && topReasons.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold text-on-surface">
            Yang paling dirasakan:
          </p>
          <div className="flex flex-wrap gap-1">
            {topReasons.map(({ reason, count }) => (
              <span
                key={reason}
                className="rounded-full bg-surface-low px-2 py-0.5 text-xs text-on-surface-variant"
              >
                {reason.replace(/_/g, " ")} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nearby reports */}
      {nearbyReports.length > 0 && (
        <div className="mt-3 border-t border-outline-variant/30 pt-3">
          <p className="mb-1.5 text-xs font-semibold text-on-surface">
            Laporan di sekitar ({nearbyReports.length})
          </p>
          <ul className="space-y-1.5">
            {nearbyReports.map((report) => (
              <li key={report.id}>
                <Link
                  href={`/laporan/${report.id}`}
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                >
                  <MapPin className="h-3 w-3 shrink-0 text-outline" />
                  <span className="truncate font-medium">{report.title}</span>
                  <span className="ml-auto shrink-0 text-outline">
                    {CATEGORY_LABELS[report.category]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onOpenDialog}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97]"
        >
          <Plus className="h-3.5 w-3.5" />
          Bagikan Persepsi
        </button>
      </div>
    </div>
  );
}
