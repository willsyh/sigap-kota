"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Eye, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PERCEPTION_REASON_LABELS,
  PERCEPTION_REASONS,
  PERCEPTION_SENTIMENTS,
  PERCEPTION_SENTIMENT_COLORS,
  PERCEPTION_SENTIMENT_LABELS,
} from "@/lib/constants/perceptions";
import type {
  PerceptionReason,
  PerceptionSentiment,
} from "@/lib/supabase/types";

interface PersepsiRow {
  id: string;
  latitude: number;
  longitude: number;
  sentiment: PerceptionSentiment;
  reason: PerceptionReason | null;
  report_id: string | null;
  created_at: string;
}

async function fetchPersepsi(): Promise<PersepsiRow[]> {
  const response = await fetch("/api/persepsi?days=30");
  if (!response.ok) throw new Error("Gagal memuat data persepsi");
  return response.json();
}

export default function AdminPersepsiPage() {
  const {
    data: persepsi = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<PersepsiRow[]>({
    queryKey: ["persepsi", "admin"],
    queryFn: fetchPersepsi,
  });

  const stats = useMemo(() => {
    const bySentiment: Record<PerceptionSentiment, number> = {
      nyaman: 0,
      biasa: 0,
      tidak_nyaman: 0,
    };
    const byReason = new Map<PerceptionReason, number>();
    for (const item of persepsi) {
      bySentiment[item.sentiment] += 1;
      if (item.reason) {
        byReason.set(item.reason, (byReason.get(item.reason) ?? 0) + 1);
      }
    }

    let topReason: PerceptionReason | null = null;
    let topReasonCount = 0;
    for (const reason of PERCEPTION_REASONS) {
      const count = byReason.get(reason) ?? 0;
      if (count > topReasonCount) {
        topReason = reason;
        topReasonCount = count;
      }
    }

    const rankedReasons = PERCEPTION_REASONS.map((reason) => ({
      reason,
      count: byReason.get(reason) ?? 0,
    }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total: persepsi.length,
      bySentiment,
      topReason,
      topReasonCount,
      rankedReasons,
    };
  }, [persepsi]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Persepsi Warga</h1>
          <p className="text-sm text-outline">
            Unseen Insight — apa yang dirasakan warga 30 hari terakhir.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Segarkan
        </Button>
      </div>

      {/* Main Content */}
      <section className="rounded-xl border border-outline-variant/25 bg-surface-lowest p-5 shadow-[0_2px_12px_rgba(0,109,119,0.05)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold text-on-surface">
              Unseen Insight
            </h2>
            <p className="mt-1 text-xs text-outline">
              Persepsi agregat warga untuk mendeteksi masalah sebelum laporan
              formal masuk.
            </p>
          </div>
          {stats.total > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              {stats.total.toLocaleString("id-ID")} persepsi
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-on-surface-variant">
              Gagal memuat data persepsi.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : stats.total === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Eye className="h-8 w-8 text-outline" aria-hidden="true" />
            <p className="text-sm font-medium text-on-surface">
              Belum ada persepsi warga.
            </p>
            <p className="text-xs text-outline">
              Persepsi akan tampil di sini setelah warga mulai berbagi di peta.
            </p>
          </div>
        ) : (
          <>
            {/* Stat ringkas */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Total Persepsi",
                  value: stats.total.toLocaleString("id-ID"),
                },
                {
                  label: "% Nyaman",
                  value:
                    stats.total >= 5
                      ? `${Math.round(
                          (stats.bySentiment.nyaman / stats.total) * 100,
                        )}%`
                      : "-",
                },
                {
                  label: "% Tidak Nyaman",
                  value:
                    stats.total >= 5
                      ? `${Math.round(
                          (stats.bySentiment.tidak_nyaman / stats.total) * 100,
                        )}%`
                      : "-",
                },
                {
                  label: "Alasan Teratas",
                  value: stats.topReason
                    ? PERCEPTION_REASON_LABELS[stats.topReason]
                    : "-",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-outline-variant/25 bg-surface-low px-4 py-3"
                >
                  <p className="text-xs font-medium text-outline">{item.label}</p>
                  <p
                    className="mt-1 truncate font-heading text-2xl font-bold tracking-tight text-on-surface tabular-nums"
                    title={item.value}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {stats.total < 5 && (
              <p className="mt-3 text-xs text-outline">
                Belum cukup respons untuk melihat pola statistik yang valid.
              </p>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Rincian sentimen */}
              <div>
                <h3 className="font-heading text-sm font-semibold text-on-surface-variant">
                  Rincian sentimen
                </h3>
                <div className="mt-3 space-y-3">
                  {PERCEPTION_SENTIMENTS.map((sentiment) => {
                    const count = stats.bySentiment[sentiment];
                    const share = Math.round((count / stats.total) * 100);
                    const enoughSample = stats.total >= 5;
                    return (
                      <div key={sentiment}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-on-surface">
                            {PERCEPTION_SENTIMENT_LABELS[sentiment].label}
                          </span>
                          <span className="tabular-nums text-outline">
                            {enoughSample ? `${share}% ` : ""}(
                            {count.toLocaleString("id-ID")})
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-container">
                          <div
                            className="anim-bar-grow h-full rounded-full transition-[width] duration-500 ease-out"
                            style={{
                              width: `${Math.max(count > 0 ? 4 : 0, share)}%`,
                              backgroundColor:
                                PERCEPTION_SENTIMENT_COLORS[sentiment],
                            }}
                            role="img"
                            aria-label={`${PERCEPTION_SENTIMENT_LABELS[sentiment].label}: ${count} persepsi (${share}%)`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Alasan teratas */}
              <div>
                <h3 className="font-heading text-sm font-semibold text-on-surface-variant">
                  Alasan paling sering disebut
                </h3>
                {stats.rankedReasons.length === 0 ? (
                  <p className="mt-3 text-sm text-outline">-</p>
                ) : (
                  <ol className="mt-3 space-y-2">
                    {stats.rankedReasons.map((entry, index) => (
                      <li
                        key={entry.reason}
                        className="flex items-center justify-between rounded-lg border border-outline-variant/20 bg-surface-low px-3 py-2 text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="w-4 shrink-0 text-xs font-bold tabular-nums text-outline">
                            {index + 1}
                          </span>
                          <span className="truncate text-on-surface">
                            {PERCEPTION_REASON_LABELS[entry.reason]}
                          </span>
                        </span>
                        <span className="ml-2 shrink-0 text-xs font-bold tabular-nums text-on-surface-variant">
                          {entry.count.toLocaleString("id-ID")}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>

            <p className="mt-6 border-t border-outline-variant/20 pt-3 text-xs text-outline">
              Data persepsi bersifat agregat dan anonim demi melindungi privasi
              warga.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
