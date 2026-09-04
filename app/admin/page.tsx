"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardClock,
  Eye,
  FileText,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CATEGORY_LABELS,
  REPORT_CATEGORIES,
} from "@/lib/constants/reports";
import type { Report, ReportCategory, ReportStatus } from "@/lib/types";

async function fetchReports(): Promise<Report[]> {
  const response = await fetch("/api/laporan");
  if (!response.ok) throw new Error("Gagal memuat laporan admin");
  return response.json();
}

export default function AdminDashboardPage() {
  const {
    data: reports = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Report[]>({
    queryKey: ["admin_reports"],
    queryFn: fetchReports,
  });

  const stats = useMemo(() => {
    const byStatus: Record<ReportStatus, number> = {
      dilaporkan: 0,
      diproses: 0,
      menunggu_konfirmasi: 0,
      selesai: 0,
    };
    const byCategory: Record<ReportCategory, number> = {
      jalan_rusak: 0,
      sampah: 0,
      banjir: 0,
      fasilitas_umum: 0,
      lainnya: 0,
    };
    for (const report of reports) {
      byStatus[report.status] += 1;
      byCategory[report.category] += 1;
    }
    return { total: reports.length, byStatus, byCategory };
  }, [reports]);

  const maxCategoryValue = Math.max(...Object.values(stats.byCategory), 0);
  const topCategory: ReportCategory | null =
    maxCategoryValue > 0
      ? REPORT_CATEGORIES.reduce(
          (best, item) =>
            stats.byCategory[item] > stats.byCategory[best] ? item : best,
          REPORT_CATEGORIES[0],
        )
      : null;

  const statCards = [
    {
      label: "Total",
      value: stats.total,
      note: "Seluruh laporan tercatat",
      icon: FileText,
      iconClass: "bg-primary/10 text-primary",
      href: "/admin/laporan",
    },
    {
      label: "Menunggu",
      value: stats.byStatus.dilaporkan,
      note: "Belum ditindaklanjuti",
      icon: ClipboardClock,
      iconClass: "bg-surface-container text-on-surface-variant",
      href: "/admin/laporan",
    },
    {
      label: "Aktif",
      value: stats.byStatus.diproses,
      note: "Sedang dalam penanganan",
      icon: RefreshCw,
      iconClass: "bg-secondary/10 text-secondary",
      href: "/admin/laporan",
    },
    {
      label: "Selesai",
      value: stats.byStatus.selesai,
      note: "Ditutup dan dikonfirmasi",
      icon: CheckCircle2,
      iconClass: "bg-tertiary/10 text-tertiary",
      href: "/admin/laporan",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertCircle className="mb-3 h-11 w-11 text-destructive" />
        <h2 className="font-heading text-xl font-semibold">
          Gagal memuat data dashboard
        </h2>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-outline">
            Ringkasan status dan aktivitas seluruh kota.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Segarkan
          </Button>
        </div>
      </div>

      {/* Ringkasan status */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`anim-fade-up anim-delay-${
                index + 1
              } block rounded-xl border border-outline-variant/25 bg-surface-lowest p-5 shadow-[0_2px_12px_rgba(0,109,119,0.05)] transition-all hover:border-primary/40 hover:shadow-md`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.iconClass}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="font-heading text-sm font-semibold text-on-surface-variant">
                  {item.label}
                </h2>
              </div>
              <p className="mt-4 font-heading text-4xl font-bold tracking-tight text-on-surface tabular-nums">
                {item.value.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-xs text-outline">{item.note}</p>
            </Link>
          );
        })}
      </div>

      {/* Distribusi kategori */}
      <section className="anim-fade-up anim-delay-5 rounded-xl border border-outline-variant/25 bg-surface-lowest p-5 shadow-[0_2px_12px_rgba(0,109,119,0.05)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold text-on-surface">
              Laporan berdasarkan kategori
            </h2>
            <p className="mt-1 text-xs text-outline">
              Sebaran {stats.total.toLocaleString("id-ID")} laporan di seluruh
              kategori.
            </p>
          </div>
          {topCategory && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
              <span
                className="h-2 w-2 rounded-full bg-secondary"
                aria-hidden="true"
              />
              Terbanyak: {CATEGORY_LABELS[topCategory]}
            </span>
          )}
        </div>
        <div className="mt-6 grid grid-cols-5 gap-3 sm:gap-5">
          {REPORT_CATEGORIES.map((item) => {
            const value = stats.byCategory[item];
            const isTop = item === topCategory;
            return (
              <div
                key={item}
                className="flex min-w-0 flex-col items-center"
              >
                <div className="flex h-48 w-full flex-col items-center justify-end gap-1.5 border-b border-outline-variant/35">
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      isTop ? "text-secondary" : "text-on-surface-variant"
                    }`}
                  >
                    {value.toLocaleString("id-ID")}
                  </span>
                  {value > 0 ? (
                    <div
                      className={`w-full max-w-16 rounded-t-md ${
                        isTop ? "bg-secondary" : "bg-primary"
                      }`}
                      style={{
                        height: `${Math.max(
                          6,
                          Math.round((value / maxCategoryValue) * 100),
                        )}%`,
                      }}
                      role="img"
                      aria-label={`${CATEGORY_LABELS[item]}: ${value} laporan`}
                    />
                  ) : (
                    <div
                      className="mb-1 h-0.5 w-6 rounded-full bg-outline-variant/60"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span
                  className="mt-2 max-w-full truncate text-xs text-outline"
                  title={`${CATEGORY_LABELS[item]} (${value})`}
                >
                  {CATEGORY_LABELS[item]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick links banner */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/laporan"
          className="flex items-center justify-between rounded-xl border border-outline-variant/25 bg-surface-lowest p-4 transition hover:border-primary/40 hover:bg-primary/5"
        >
          <div>
            <p className="font-heading text-sm font-semibold">Kelola Laporan</p>
            <p className="text-xs text-outline">Ubah status, foto, atau hapus</p>
          </div>
          <FileText className="h-5 w-5 text-primary" />
        </Link>
        <Link
          href="/admin/persepsi"
          className="flex items-center justify-between rounded-xl border border-outline-variant/25 bg-surface-lowest p-4 transition hover:border-primary/40 hover:bg-primary/5"
        >
          <div>
            <p className="font-heading text-sm font-semibold">Persepsi Warga</p>
            <p className="text-xs text-outline">Wawasan Persepsi & sentimen</p>
          </div>
          <Eye className="h-5 w-5 text-secondary" />
        </Link>
        <Link
          href="/admin/log"
          className="flex items-center justify-between rounded-xl border border-outline-variant/25 bg-surface-lowest p-4 transition hover:border-primary/40 hover:bg-primary/5"
        >
          <div>
            <p className="font-heading text-sm font-semibold">Log Aktivitas</p>
            <p className="text-xs text-outline">Audit trail semua aktivitas sistem</p>
          </div>
          <RefreshCw className="h-5 w-5 text-tertiary" />
        </Link>
        <Link
          href="/admin/panduan"
          className="flex items-center justify-between rounded-xl border border-outline-variant/25 bg-surface-lowest p-4 transition hover:border-primary/40 hover:bg-primary/5"
        >
          <div>
            <p className="font-heading text-sm font-semibold">Panduan Admin</p>
            <p className="text-xs text-outline">SOP operasional & tata cara</p>
          </div>
          <AlertCircle className="h-5 w-5 text-primary" />
        </Link>
      </div>
    </div>
  );
}
