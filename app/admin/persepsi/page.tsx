"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
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

const AdminPerceptionMap = dynamic(
  () => import("@/components/perceptions/AdminPerceptionMap"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-xl" />,
  },
);

interface PersepsiRow {
  id: string;
  latitude: number;
  longitude: number;
  sentiment: PerceptionSentiment;
  reason: PerceptionReason | null;
  note: string | null;
  photo_url: string | null;
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
            Sebaran dan sentimen warga 30 hari terakhir.
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

      {isLoading ? (
        <div className="space-y-6">
          {/* Map skeleton */}
          <section className="rounded-xl border border-outline-variant/25 bg-surface-lowest p-5 shadow-[0_2px_12px_rgba(0,109,119,0.05)] sm:p-6">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="mt-2 h-4 w-72" />
            <Skeleton className="mt-4 h-[360px] w-full rounded-xl md:h-[420px]" />
          </section>

          {/* Stat cards skeleton */}
          <section className="rounded-xl border border-outline-variant/25 bg-surface-lowest p-5 shadow-[0_2px_12px_rgba(0,109,119,0.05)] sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-xl" />
              ))}
            </div>
          </section>

          {/* Detail skeleton */}
          <section className="rounded-xl border border-outline-variant/25 bg-surface-lowest p-5 shadow-[0_2px_12px_rgba(0,109,119,0.05)] sm:p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          </section>
        </div>
      ) : isError ? (
        <section className="rounded-xl border border-outline-variant/25 bg-surface-lowest p-5 shadow-[0_2px_12px_rgba(0,109,119,0.05)] sm:p-6">
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-on-surface-variant">
              Gagal memuat data persepsi.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Coba lagi
            </Button>
          </div>
        </section>
      ) : stats.total === 0 ? (
        <section className="rounded-xl border border-outline-variant/25 bg-surface-lowest p-5 shadow-[0_2px_12px_rgba(0,109,119,0.05)] sm:p-6">
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Eye className="h-8 w-8 text-outline" aria-hidden="true" />
            <p className="text-sm font-medium text-on-surface">
              Belum ada persepsi warga.
            </p>
            <p className="text-xs text-outline">
              Persepsi akan tampil di sini setelah warga mulai berbagi di peta.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* Peta Persepsi */}
          <section className="rounded-xl border border-outline-variant/25 bg-surface-lowest p-5 shadow-[0_2px_12px_rgba(0,109,119,0.05)] sm:p-6">
            <h2 className="font-heading text-xl font-semibold text-on-surface">
              Peta Persepsi
            </h2>
            <p className="mt-1 text-xs text-outline">
              Titik berwarna menunjukkan sentimen warga di lokasi.
            </p>
            <div className="mt-4 h-[360px] overflow-hidden rounded-xl md:h-[420px]">
              <AdminPerceptionMap points={persepsi} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              {PERCEPTION_SENTIMENTS.map((sentiment) => (
                <span
                  key={sentiment}
                  className="flex items-center gap-2 text-xs text-on-surface-variant"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: PERCEPTION_SENTIMENT_COLORS[sentiment],
                    }}
                  />
                  {PERCEPTION_SENTIMENT_LABELS[sentiment].label}
                </span>
              ))}
            </div>
          </section>

          {/* Statistik */}
          <section className="rounded-xl border border-outline-variant/25 bg-surface-lowest p-5 shadow-[0_2px_12px_rgba(0,109,119,0.05)] sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                  label: "% Biasa saja",
                  value:
                    stats.total >= 5
                      ? `${Math.round(
                          (stats.bySentiment.biasa / stats.total) * 100,
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
          </section>

          {/* Rincian */}
          <section className="rounded-xl border border-outline-variant/25 bg-surface-lowest p-5 shadow-[0_2px_12px_rgba(0,109,119,0.05)] sm:p-6">
            <div className="grid gap-6 lg:grid-cols-2">
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
          </section>

          {/* Persepsi terbaru */}
          <section className="rounded-xl border border-outline-variant/25 bg-surface-lowest p-5 shadow-[0_2px_12px_rgba(0,109,119,0.05)] sm:p-6">
            <h2 className="font-heading text-xl font-semibold text-on-surface">
              Persepsi terbaru
            </h2>
            <ul className="mt-2 divide-y divide-outline-variant/15">
              {persepsi.slice(0, 10).map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  {item.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photo_url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-on-surface">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              PERCEPTION_SENTIMENT_COLORS[item.sentiment],
                          }}
                        />
                        {PERCEPTION_SENTIMENT_LABELS[item.sentiment].label}
                      </span>
                      {item.reason && (
                        <span className="text-xs text-on-surface-variant">
                          {PERCEPTION_REASON_LABELS[item.reason]}
                        </span>
                      )}
                      {item.report_id && (
                        <Link
                          href={`/laporan/${item.report_id}`}
                          className="text-xs font-medium text-primary transition-colors hover:underline"
                        >
                          Lihat laporan
                        </Link>
                      )}
                    </div>
                    {item.note && (
                      <p className="mt-0.5 truncate text-sm text-on-surface-variant">
                        {item.note}
                      </p>
                    )}
                  </div>
                  <time
                    dateTime={item.created_at}
                    className="shrink-0 text-xs tabular-nums text-outline"
                  >
                    {new Date(item.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </time>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-xs text-outline">
            Persepsi ditampilkan tanpa identitas pengirim demi melindungi
            privasi warga.
          </p>
        </>
      )}
    </div>
  );
}