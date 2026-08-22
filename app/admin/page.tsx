"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BarChart3,
  FileText,
  Search,
  AlertCircle,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  REPORT_CATEGORIES,
  REPORT_STATUSES,
} from "@/lib/constants/reports";
import type { Report, ReportCategory, ReportStatus } from "@/lib/types";

async function fetchAdminReports(): Promise<Report[]> {
  const res = await fetch("/api/laporan");
  if (!res.ok) throw new Error("Gagal memuat laporan admin");
  return res.json();
}

// ============ Overview stats ============
function OverviewTab({ reports }: { reports: Report[] }) {
  const stats = useMemo(() => {
    const byStatus: Record<ReportStatus, number> = {
      dilaporkan: 0,
      diproses: 0,
      selesai: 0,
    };
    const byCategory: Record<ReportCategory, number> = {
      jalan_rusak: 0,
      sampah: 0,
      banjir: 0,
      fasilitas_umum: 0,
      lainnya: 0,
    };
    for (const r of reports) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
    }
    return { total: reports.length, byStatus, byCategory };
  }, [reports]);

  const statusCards: {
    status: ReportStatus;
    label: string;
    icon: typeof Clock;
    color: string;
  }[] = [
    { status: "dilaporkan", label: "Dilaporkan", icon: AlertTriangle, color: "text-amber-500" },
    { status: "diproses", label: "Diproses", icon: Clock, color: "text-blue-500" },
    { status: "selesai", label: "Selesai", icon: CheckCircle2, color: "text-emerald-500" },
  ];

  const recent = useMemo(
    () =>
      [...reports]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [reports],
  );

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Total Laporan</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        {statusCards.map((sc) => {
          const Icon = sc.icon;
          return (
            <Card key={sc.status}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs text-muted-foreground font-medium">
                  {sc.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${sc.color}`} />
                  <span className="text-3xl font-bold">{stats.byStatus[sc.status]}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category distribution */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Distribusi Kategori</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-2.5">
          {REPORT_CATEGORIES.map((cat) => {
            const count = stats.byCategory[cat] ?? 0;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{CATEGORY_LABELS[cat]}</span>
                  <span className="text-muted-foreground">
                    {count} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: CATEGORY_COLORS[cat],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recent reports */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Laporan Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Belum ada laporan.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {CATEGORY_LABELS[r.category]} —{" "}
                      {new Date(r.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {STATUS_LABELS[r.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ All reports table ============
function AllReportsTab({ reports }: { reports: Report[] }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<ReportCategory | "all">("all");
  const [statFilter, setStatFilter] = useState<ReportStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReportStatus }) => {
      setUpdatingId(id);
      const res = await fetch(`/api/laporan/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Gagal memperbarui status");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Status laporan berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["admin_reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal mengubah status");
    },
    onSettled: () => {
      setUpdatingId(null);
    },
  });

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        search.trim() === "" ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || r.category === catFilter;
      const matchStat = statFilter === "all" || r.status === statFilter;
      return matchSearch && matchCat && matchStat;
    });
  }, [reports, search, catFilter, statFilter]);

  const handleStatusChange = (reportId: string, newStatus: ReportStatus) => {
    statusMutation.mutate({ id: reportId, status: newStatus });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul atau ID..."
            className="h-9 pl-9 text-sm"
          />
        </div>
        <Select value={catFilter} onValueChange={(v) => setCatFilter(v as ReportCategory | "all")}>
          <SelectTrigger className="h-9 w-[160px] text-xs">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {REPORT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statFilter} onValueChange={(v) => setStatFilter(v as ReportStatus | "all")}>
          <SelectTrigger className="h-9 w-[140px] text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {REPORT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} laporan</span>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Judul</TableHead>
                <TableHead className="text-xs w-[120px]">Kategori</TableHead>
                <TableHead className="text-xs w-[100px]">Dukungan</TableHead>
                <TableHead className="text-xs w-[100px]">Tanggal</TableHead>
                <TableHead className="text-xs w-[160px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const isRowUpdating = updatingId === r.id;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium max-w-[280px] truncate">
                      {r.title}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px]"
                        style={{
                          borderColor: CATEGORY_COLORS[r.category],
                          color: CATEGORY_COLORS[r.category],
                        }}
                      >
                        {CATEGORY_LABELS[r.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.vote_count ?? 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={r.status}
                          disabled={isRowUpdating}
                          onValueChange={(v) => handleStatusChange(r.id, v as ReportStatus)}
                        >
                          <SelectTrigger className="h-7 w-[140px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REPORT_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isRowUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-semibold">Tidak ada laporan ditemukan</h3>
          <p className="text-xs text-muted-foreground mt-1">Coba ubah filter pencarian.</p>
        </div>
      )}
    </div>
  );
}

// ============ Main Admin Page ============
export default function AdminPage() {
  const { data: reports = [], isLoading, isError, refetch } = useQuery<Report[]>({
    queryKey: ["admin_reports"],
    queryFn: fetchAdminReports,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="container flex-1 px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Panel Admin</h1>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-9 w-48" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center py-20 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="text-base font-semibold">Gagal memuat data admin</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Pastikan kamu memiliki akses admin dan koneksi database aktif.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">
                <BarChart3 className="h-4 w-4 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="reports">
                <FileText className="h-4 w-4 mr-1" />
                Semua Laporan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab reports={reports} />
            </TabsContent>

            <TabsContent value="reports">
              <AllReportsTab reports={reports} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
