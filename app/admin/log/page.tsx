"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  FilePlus2,
  Filter,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_LABELS } from "@/lib/constants/reports";
import type { ReportCategory } from "@/lib/types";
import type { ActivityItem } from "@/app/api/admin/activity-logs/route";

async function fetchActivityLogs(): Promise<ActivityItem[]> {
  const response = await fetch("/api/admin/activity-logs");
  if (!response.ok) throw new Error("Gagal memuat log aktivitas");
  return response.json();
}

const TYPE_CONFIG = {
  status_change: {
    label: "Status Diperbarui",
    icon: RefreshCw,
    badgeClass: "bg-secondary/10 text-secondary border-secondary/20",
  },
  deletion: {
    label: "Laporan Dihapus",
    icon: Trash2,
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
  },
  report_created: {
    label: "Laporan Masuk",
    icon: FilePlus2,
    badgeClass: "bg-primary/10 text-primary border-primary/20",
  },
};

export default function AdminLogPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const {
    data: activityLogs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<ActivityItem[]>({
    queryKey: ["activity_logs"],
    queryFn: fetchActivityLogs,
  });

  const filteredLogs = activityLogs.filter((log) => {
    if (typeFilter === "all") return true;
    return log.type === typeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Log Aktivitas</h1>
          <p className="text-sm text-outline">
            Audit trail aktivitas sistem: laporan masuk, pembaruan status, dan penghapusan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val ?? "all")}>
            <SelectTrigger className="h-9 w-44 bg-surface-lowest">
              <Filter className="mr-2 h-3.5 w-3.5 text-outline" />
              <SelectValue placeholder="Tipe aktivitas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua aktivitas</SelectItem>
              <SelectItem value="report_created">Laporan Masuk</SelectItem>
              <SelectItem value="status_change">Perubahan Status</SelectItem>
              <SelectItem value="deletion">Penghapusan</SelectItem>
            </SelectContent>
          </Select>

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
      </div>

      {/* Main Table Card */}
      <section className="overflow-hidden rounded-xl border border-outline-variant/25 bg-surface-lowest shadow-[0_2px_12px_rgba(0,109,119,0.05)]">
        {isLoading ? (
          <div className="space-y-3 p-5 sm:p-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
            <p className="text-sm text-on-surface-variant">
              Gagal memuat log aktivitas.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Activity className="h-8 w-8 text-outline" aria-hidden="true" />
            <p className="text-sm font-medium">Belum ada log aktivitas</p>
            <p className="text-xs text-outline">
              Aktivitas sistem akan otomatis tercatat di sini secara real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-low text-xs font-bold uppercase tracking-wider text-outline">
                  <th className="px-4 py-3 font-bold">Waktu</th>
                  <th className="px-4 py-3 font-bold">Jenis Aktivitas</th>
                  <th className="px-4 py-3 font-bold">Laporan Terkait</th>
                  <th className="px-4 py-3 font-bold">Kategori</th>
                  <th className="px-4 py-3 font-bold">Keterangan</th>
                  <th className="px-4 py-3 font-bold">Pelaku</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/25">
                {filteredLogs.map((log) => {
                  const cfg = TYPE_CONFIG[log.type];
                  const Icon = cfg.icon;
                  const categoryLabel =
                    log.category && log.category in CATEGORY_LABELS
                      ? CATEGORY_LABELS[log.category as ReportCategory]
                      : "-";

                  return (
                    <tr
                      key={log.id}
                      className="transition-colors duration-150 ease-out hover:bg-surface-low/70"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-outline">
                        {new Date(log.timestamp).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.badgeClass}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="max-w-xs px-4 py-3">
                        {log.reportId && log.type !== "deletion" ? (
                          <Link
                            href={`/laporan/${log.reportId}`}
                            className="block truncate text-sm font-medium text-on-surface hover:text-primary"
                          >
                            {log.title}
                          </Link>
                        ) : (
                          <p className="truncate text-sm font-medium text-on-surface">
                            {log.title}
                          </p>
                        )}
                        {log.reportId && (
                          <p
                            className="mt-0.5 truncate text-[11px] text-outline font-mono"
                            title={log.reportId}
                          >
                            {log.reportId.slice(0, 8)}...
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {categoryLabel !== "-" ? (
                          <span className="rounded-full bg-tertiary/10 px-2 py-0.5 text-xs font-medium text-tertiary">
                            {categoryLabel}
                          </span>
                        ) : (
                          <span className="text-xs text-outline">-</span>
                        )}
                      </td>
                      <td className="max-w-sm px-4 py-3">
                        <p
                          className="line-clamp-2 text-sm text-on-surface-variant"
                          title={log.description}
                        >
                          {log.description}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            log.actorRole === "admin"
                              ? "bg-primary/10 text-primary"
                              : "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          {log.actorRole === "admin" ? "Admin" : "Warga"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
