"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  Download,
  ImageOff,
  ImagePlus,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ThumbsUp,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  CATEGORY_LABELS,
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  STATUS_LABELS,
  STATUS_META,
} from "@/lib/constants/reports";
import type { Report, ReportCategory, ReportStatus } from "@/lib/types";

type PhotoPopupMode = "complete" | "replace";

async function fetchReports(): Promise<Report[]> {
  const response = await fetch("/api/laporan");
  if (!response.ok) throw new Error("Gagal memuat laporan admin");
  return response.json();
}

const ADMIN_SELECTABLE: ReportStatus[] = ["dilaporkan", "diproses"];

function formatCoord(value: number): string {
  return value.toFixed(5);
}

export default function AdminLaporanPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ReportCategory | "all">("all");
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [photoTarget, setPhotoTarget] = useState<Report | null>(null);
  const [photoMode, setPhotoMode] = useState<PhotoPopupMode>("complete");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const {
    data: reports = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Report[]>({
    queryKey: ["admin_reports"],
    queryFn: fetchReports,
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      nextStatus,
    }: {
      id: string;
      nextStatus: ReportStatus;
    }) => {
      const response = await fetch(`/api/laporan/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Gagal memperbarui status");
      }
      return response.json();
    },
    onMutate: ({ id }) => setUpdatingId(id),
    onSuccess: () => {
      toast.success("Status laporan diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["admin_reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setUpdatingId(null),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({
      report,
      file,
      mode,
    }: {
      report: Report;
      file: File;
      mode: PhotoPopupMode;
    }) => {
      const form = new FormData();
      form.append("photo_after", file);
      const endpoint =
        mode === "replace"
          ? `/api/laporan/${report.id}/foto-after`
          : `/api/laporan/${report.id}`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        body: form,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Gagal mengupload foto");
      }
      return response.json();
    },
    onMutate: ({ report }) => setUpdatingId(report.id),
    onSuccess: (_data, { mode }) => {
      toast.success(
        mode === "replace"
          ? "Foto sesudah berhasil diganti."
          : "Foto berhasil diupload. Menunggu konfirmasi pelapor.",
      );
      queryClient.invalidateQueries({ queryKey: ["admin_reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      closePhotoPopup();
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setUpdatingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/laporan/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Gagal menghapus laporan");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Laporan dihapus. Penghapusan tercatat di log.");
      queryClient.invalidateQueries({ queryKey: ["admin_reports"] });
      queryClient.invalidateQueries({ queryKey: ["deletion_logs"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      closeDeletePopup();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    return reports.filter((report) => {
      const matchesQuery =
        !query ||
        `${report.id} ${report.title}`.toLocaleLowerCase("id-ID").includes(query);
      return (
        matchesQuery &&
        (category === "all" || report.category === category) &&
        (status === "all" || report.status === status)
      );
    });
  }, [category, reports, search, status]);

  function exportReports() {
    const rows = [
      ["ID", "Judul", "Kategori", "Status", "Dukungan", "Latitude", "Longitude"],
      ...filtered.map((report) => [
        report.id,
        report.title,
        CATEGORY_LABELS[report.category],
        STATUS_LABELS[report.status],
        report.vote_count,
        report.latitude,
        report.longitude,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "laporan-sigapkota.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleStatusChange(report: Report, nextStatus: ReportStatus) {
    if (nextStatus === "selesai" || nextStatus === "menunggu_konfirmasi") {
      setPhotoMode("complete");
      setPhotoTarget(report);
      return;
    }
    if (ADMIN_SELECTABLE.includes(nextStatus)) {
      statusMutation.mutate({ id: report.id, nextStatus });
    }
  }

  function closePhotoPopup() {
    setPhotoTarget(null);
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  }

  function openReplacePhotoPopup(report: Report) {
    setPhotoMode("replace");
    setPhotoTarget(report);
  }

  function closeDeletePopup() {
    setDeleteTarget(null);
    setDeleteReason("");
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Manajemen Laporan</h1>
          <p className="text-sm text-outline">
            Kelola status, bukti penyelesaian, dan data seluruh laporan aktif.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Segarkan
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportReports}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Ekspor CSV
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <section className="overflow-hidden rounded-xl border border-outline-variant/25 bg-surface-lowest shadow-[0_2px_12px_rgba(0,109,119,0.05)]">
        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 p-4 sm:p-5">
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul atau ID..."
              className="h-10 pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen((o) => !o)}
              className="h-10 gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter {category !== "all" || status !== "all" ? "• Aktif" : ""}
            </Button>
          </div>
        </div>

        {filtersOpen && (
          <div className="grid gap-3 border-b border-outline-variant/30 bg-surface-low p-4 sm:grid-cols-2">
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as ReportCategory | "all")}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kategori</SelectItem>
                {REPORT_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {CATEGORY_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(val) => setStatus(val as ReportStatus | "all")}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                {REPORT_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {STATUS_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Table Content */}
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
            <p className="text-sm font-medium">Gagal memuat daftar laporan</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => refetch()}
            >
              Coba lagi
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-low text-xs font-bold uppercase tracking-wider text-outline">
                  <th className="px-4 py-3 font-bold">Foto</th>
                  <th className="px-4 py-3 font-bold">Detail laporan</th>
                  <th className="px-4 py-3 font-bold">Lokasi</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-center font-bold">Dukungan</th>
                  <th className="px-4 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/25">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Search
                        className="mx-auto mb-3 h-8 w-8 text-outline"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-medium text-on-surface">
                        Tidak ada laporan yang cocok
                      </p>
                      <p className="mt-1 text-xs text-outline">
                        Ubah kata kunci pencarian atau reset filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((report) => {
                    const meta = STATUS_META[report.status];
                    const lockedStatus =
                      report.status === "menunggu_konfirmasi" ||
                      report.status === "selesai";
                    return (
                      <tr
                        key={report.id}
                        className="transition-colors duration-150 ease-out hover:bg-surface-low/70"
                      >
                        <td className="px-4 py-3">
                          {report.photo_url ? (
                            <div className="h-12 w-12 overflow-hidden rounded-lg border border-outline-variant/20">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={report.photo_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container text-outline">
                              <ImageOff
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </div>
                          )}
                        </td>
                        <td className="max-w-xs px-4 py-3">
                          <Link
                            href={`/laporan/${report.id}`}
                            className="block truncate text-sm font-medium text-on-surface transition-colors duration-150 ease-out hover:text-primary"
                          >
                            {report.title}
                          </Link>
                          <div className="mt-1 flex items-center gap-2 text-xs text-outline">
                            <span className="rounded-full bg-tertiary/10 px-2 py-0.5 font-medium text-tertiary">
                              {CATEGORY_LABELS[report.category]}
                            </span>
                            <span>
                              {new Date(report.created_at).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          {report.ai_verdict === "mismatch" && (
                            <span
                              title={
                                report.ai_reason ??
                                "AI menilai foto tidak sesuai dengan judul/deskripsi"
                              }
                              className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive"
                            >
                              <AlertTriangle
                                className="h-3 w-3"
                                aria-hidden="true"
                              />
                              AI: tidak sesuai
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <p className="text-sm tabular-nums text-on-surface-variant">
                            {formatCoord(report.latitude)},{" "}
                            {formatCoord(report.longitude)}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-outline">
                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                            Koordinat pelapor
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {lockedStatus ? (
                              <span
                                className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-medium ${meta.pillClassName}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${meta.dotClassName}`}
                                  aria-hidden="true"
                                />
                                {meta.label}
                              </span>
                            ) : (
                              <Select
                                value={report.status}
                                disabled={updatingId === report.id}
                                onValueChange={(value) =>
                                  handleStatusChange(
                                    report,
                                    value as ReportStatus,
                                  )
                                }
                              >
                                <SelectTrigger className={`h-8 w-36 rounded-full text-xs font-medium border ${meta.pillClassName}`}>
                                  <span className="inline-flex items-center gap-1.5 truncate">
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${meta.dotClassName}`}
                                      aria-hidden="true"
                                    />
                                    {STATUS_LABELS[report.status]}
                                  </span>
                                </SelectTrigger>
                                <SelectContent alignItemWithTrigger={false} side="bottom" align="start">
                                  {ADMIN_SELECTABLE.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {STATUS_LABELS[item]}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="selesai">
                                    Tandai Selesai...
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {updatingId === report.id && (
                              <Loader2
                                className="h-4 w-4 animate-spin text-outline"
                                aria-label="Memperbarui"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums">
                            <ThumbsUp
                              className="h-4 w-4 text-secondary"
                              aria-hidden="true"
                            />
                            {(report.vote_count ?? 0).toLocaleString("id-ID")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/laporan/${report.id}`}
                              className="mr-1 inline-flex h-9 items-center rounded-lg px-3 text-xs font-medium text-primary transition-colors duration-150 ease-out hover:bg-primary/10"
                            >
                              Lihat detail
                            </Link>
                            {(report.status === "menunggu_konfirmasi" ||
                              report.status === "selesai") && (
                              <button
                                type="button"
                                onClick={() => openReplacePhotoPopup(report)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-all duration-150 ease-out hover:bg-surface-container hover:text-primary active:scale-[0.95]"
                                aria-label={`Ganti foto sesudah untuk laporan ${report.title}`}
                                title="Ganti foto sesudah"
                              >
                                <ImagePlus
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(report)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-outline transition-all duration-150 ease-out hover:bg-destructive/10 hover:text-destructive active:scale-[0.95]"
                              aria-label={`Hapus laporan ${report.title}`}
                              title="Hapus laporan"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-outline-variant/30 bg-surface px-5 py-4 text-xs text-outline">
          <span>
            Menampilkan {filtered.length.toLocaleString("id-ID")} dari{" "}
            {reports.length.toLocaleString("id-ID")} laporan
          </span>
        </div>
      </section>

      {/* Dialog upload / ganti foto sesudah */}
      <Dialog
        open={photoTarget !== null}
        onOpenChange={(open) => {
          if (!open) closePhotoPopup();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {photoMode === "replace"
                ? "Ganti Foto Sesudah"
                : "Upload Foto Bukti Penyelesaian"}
            </DialogTitle>
            <DialogDescription>
              {photoMode === "replace" ? (
                <>
                  Ganti foto sesudah untuk laporan{" "}
                  <span className="font-semibold text-on-surface">
                    &ldquo;{photoTarget?.title}&rdquo;
                  </span>
                  . Status laporan tidak akan berubah.
                </>
              ) : (
                <>
                  Upload foto bukti penanganan untuk laporan{" "}
                  <span className="font-semibold text-on-surface">
                    &ldquo;{photoTarget?.title}&rdquo;
                  </span>
                  . Setelah diupload, pelapor akan diminta mengkonfirmasi bahwa
                  masalah benar-benar sudah selesai.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-outline-variant/50 bg-surface-low p-8 text-center transition-colors duration-150 ease-out hover:border-primary/50 hover:bg-primary/5"
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="Preview"
                className="max-h-48 rounded-lg object-contain"
              />
            ) : (
              <>
                <Upload className="h-8 w-8 text-outline" aria-hidden="true" />
                <span className="text-sm text-outline">Klik untuk pilih foto</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileSelect}
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={closePhotoPopup}
              disabled={uploadMutation.isPending}
            >
              Batal
            </Button>
            <Button
              className="flex-1"
              disabled={!photoFile || uploadMutation.isPending}
              onClick={() => {
                if (photoTarget && photoFile)
                  uploadMutation.mutate({
                    report: photoTarget,
                    file: photoFile,
                    mode: photoMode,
                  });
              }}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : photoMode === "replace" ? (
                "Simpan Foto"
              ) : (
                "Kirim & Minta Konfirmasi"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog hapus laporan */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) closeDeletePopup();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Laporan</DialogTitle>
            <DialogDescription>
              Laporan{" "}
              <span className="font-semibold text-on-surface">
                &ldquo;{deleteTarget?.title}&rdquo;
              </span>{" "}
              akan dihapus permanen. Alasan penghapusan wajib diisi dan akan
              tercatat di log.
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={deleteReason}
            onChange={(event) => setDeleteReason(event.target.value)}
            placeholder="Tuliskan alasan penghapusan..."
            rows={3}
            aria-label="Alasan penghapusan"
            className="w-full resize-none rounded-xl border border-outline-variant/40 bg-surface-low px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-outline focus:border-primary"
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={closeDeletePopup}
              disabled={deleteMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={!deleteReason.trim() || deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget)
                  deleteMutation.mutate({
                    id: deleteTarget.id,
                    reason: deleteReason.trim(),
                  });
              }}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Hapus Permanen"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
