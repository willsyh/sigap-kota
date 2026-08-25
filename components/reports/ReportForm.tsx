"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, CircleDot, Copy, Crosshair, Ellipsis, ImagePlus, Landmark, Loader2, MapPin, ThumbsUp, Trash2, Waves, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LocationPickerMapWrapper from "@/components/reports/LocationPickerMapWrapper";
import {
  CATEGORY_LABELS,
  REPORT_CATEGORIES,
  STATUS_BADGE_VARIANTS,
  STATUS_LABELS,
} from "@/lib/constants/reports";
import type { ReportCategory, ReportStatus } from "@/lib/types";

// Default: area Pamulang
const DEFAULT_COORDS = { lat: -6.3458, lng: 106.7394 };

interface DuplicateCandidate {
  id: string;
  title: string;
  vote_count: number | null;
  distance_meters: number;
  status: string;
}

function buildDuplicateKey(category: string, lat: number, lng: number) {
  return `${category}|${lat.toFixed(6)}|${lng.toFixed(6)}`;
}

export default function ReportForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Duplicate detection: tidak memblokir submit, hanya menyarankan dukungan
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [checkingKey, setCheckingKey] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [votingId, setVotingId] = useState<string | null>(null);
  const dismissedKeyRef = useRef<string | null>(null);
  // True setelah user menggeser/mengklik peta secara manual; auto-detect
  // GPS awal tidak boleh menimpa posisi pilihan user.
  const userAdjustedRef = useRef(false);
  const duplicateKey = category
    ? buildDuplicateKey(category, coords.lat, coords.lng)
    : null;
  const checkingDuplicates = duplicateKey !== null && checkingKey === duplicateKey;

  // Auto-detect lokasi user saat halaman dibuka
  function detectLocation() {
    if (!("geolocation" in navigator)) {
      toast.info("Browser tidak mendukung deteksi lokasi. Geser marker secara manual.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        toast.error(
          "Gagal mendeteksi lokasi. Izinkan akses lokasi atau geser marker secara manual.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Abaikan hasil yang datang terlambat (setelah unmount) atau jika
        // user sudah memilih posisi secara manual di peta.
        if (cancelled || userAdjustedRef.current) return;
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Abaikan error pada auto-detect awal; user bisa klik tombol "Deteksi"
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Cek laporan serupa (debounce 600ms) saat kategori + koordinat terisi.
  // Gagal fetch/error check_failed diabaikan diam-diam: fitur ini tidak
  // boleh memblokir pembuatan laporan.
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    if (!category || !duplicateKey) {
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    const currentKey = duplicateKey;
    if (dismissedKeyRef.current === currentKey) {
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingKey(currentKey);

        const res = await fetch("/api/laporan/check-duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: coords.lat, lng: coords.lng, category }),
          signal: controller.signal,
        });

        if (cancelled || !res.ok) return;

        const data = await res.json().catch(() => null);
        if (cancelled || !data || data.error === "check_failed") return;

        const list = Array.isArray(data.candidates)
          ? (data.candidates as DuplicateCandidate[])
          : [];
        setCandidates(list.slice(0, 3));
      } catch {
        // AbortError atau kegagalan jaringan: abaikan, jangan blokir form
      } finally {
        if (!cancelled) setCheckingKey(null);
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [category, coords.lat, coords.lng, duplicateKey]);

  async function handleSupport(candidateId: string) {
    setVotingId(candidateId);

    try {
      const res = await fetch(`/api/laporan/${candidateId}/vote`, {
        method: "POST",
      });

      if (res.status === 401) {
        toast.info("Masuk terlebih dahulu untuk mendukung laporan ini.");
        const next = encodeURIComponent(window.location.pathname);
        router.push(`/auth/login?next=${next}`);
        return;
      }

      if (res.status === 409) {
        setVotedIds((prev) => new Set(prev).add(candidateId));
        toast.info("Kamu sudah mendukung laporan ini sebelumnya.");
        return;
      }

      if (!res.ok) {
        toast.error("Gagal mendukung laporan. Coba lagi.");
        return;
      }

      const data = await res.json().catch(() => null);
      setVotedIds((prev) => new Set(prev).add(candidateId));

      if (data && typeof data.vote_count === "number") {
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === candidateId ? { ...c, vote_count: data.vote_count } : c,
          ),
        );
      }

      toast.success("Dukungan terkirim. Terima kasih.");
    } catch {
      toast.error("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setVotingId(null);
    }
  }

  function handleDismissDuplicates() {
    dismissedKeyRef.current = buildDuplicateKey(
      category,
      coords.lat,
      coords.lng,
    );
    setCandidates([]);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Format foto harus JPEG, PNG, atau WebP");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5MB");
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleRemovePhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!category) {
      toast.error("Silakan pilih kategori laporan");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("latitude", String(coords.lat));
      formData.append("longitude", String(coords.lng));
      if (photo) {
        formData.append("photo", photo);
      }

      const response = await fetch("/api/laporan", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.id) {
        toast.error(data?.error ?? "Gagal mengirim laporan. Coba lagi.");
        return;
      }

      toast.success("Laporan berhasil dikirim!");
      router.push(`/laporan/${data.id}`);
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-28">
      {/* Duplicate detection: banner di atas form agar langsung terlihat,
          tidak memblokir submit */}
      {checkingDuplicates && candidates.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Memeriksa laporan serupa di sekitar lokasi...
        </p>
      )}

      {candidates.length > 0 && (
        <Card className="rounded-xl border-outline-variant/30 bg-surface-container/65 shadow-[0_2px_12px_rgba(0,109,119,0.05)]">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/15">
                <Copy className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Laporan serupa ditemukan</p>
                <p className="text-xs text-muted-foreground">
                  Ada laporan aktif dengan kategori dan lokasi yang mirip.
                  Mendukung laporan yang ada membantu penanganan lebih cepat.
                </p>
              </div>
            </div>

            <ul className="divide-y overflow-hidden rounded-md border bg-background">
              {candidates.map((candidate) => {
                const voted = votedIds.has(candidate.id);
                const voting = votingId === candidate.id;

                return (
                  <li
                    key={candidate.id}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <p className="truncate text-sm font-medium">
                        {candidate.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <Badge
                          variant={
                            STATUS_BADGE_VARIANTS[
                              candidate.status as ReportStatus
                            ] ?? "outline"
                          }
                          className="px-1.5 py-0 text-[10px]"
                        >
                          {STATUS_LABELS[candidate.status as ReportStatus] ??
                            candidate.status}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {candidate.vote_count ?? 0}
                        </span>
                        <span>~{candidate.distance_meters} m</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 gap-1 text-xs"
                      disabled={voted || voting}
                      onClick={() => handleSupport(candidate.id)}
                    >
                      {voting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : voted ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Didukung
                        </>
                      ) : (
                        "Dukung laporan ini"
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={handleDismissDuplicates}
              >
                Lanjut buat laporan baru
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-6">
        {/* Kolom kiri: detail laporan */}
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="hidden p-0">
            <CardTitle className="text-sm">Detail Laporan</CardTitle>
            <CardDescription>
              Jelaskan masalah fasilitas umum yang kamu temukan.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-6 p-0">
            <div className="order-3 space-y-2">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-[0.08em]">Judul</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Jalan berlubang di depan sekolah"
                required
                maxLength={120}
                className="h-12 rounded-lg border-outline-variant bg-surface-lowest text-base shadow-[0_2px_12px_rgba(0,109,119,0.05)]"
              />
            </div>

            <div className="order-2 space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.08em]">Kategori</Label>
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
                {REPORT_CATEGORIES.map((item) => {
                  const Icon = item === "jalan_rusak" ? CircleDot : item === "sampah" ? Trash2 : item === "banjir" ? Waves : item === "fasilitas_umum" ? Landmark : Ellipsis;
                  const active = category === item;
                  return (
                    <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={active} className={`flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-2 border-tertiary bg-tertiary/10 font-semibold text-tertiary" : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container"}`}>
                      <Icon className="h-4 w-4" />{CATEGORY_LABELS[item]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="order-4 space-y-2">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-[0.08em]">Deskripsi</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan kondisi, dampak, dan waktu kejadian..."
                rows={5}
                maxLength={1000}
                className="rounded-lg border-outline-variant bg-surface-lowest text-base leading-relaxed shadow-[0_2px_12px_rgba(0,109,119,0.05)]"
              />
            </div>

            <div className="order-1 space-y-2">
              <Label htmlFor="photo" className="text-xs font-bold uppercase tracking-[0.08em]">Foto Bukti</Label>

              {photoPreview ? (
                <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-outline-variant/40 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Pratinjau foto"
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-1 top-1 h-10 w-10 rounded-full"
                    onClick={handleRemovePhoto}
                    aria-label="Hapus foto"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant bg-surface-low text-outline transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-xs">
                    Tambah foto
                  </span>
                </button>
              )}

              <input
                ref={fileInputRef}
                id="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Kolom kanan: lokasi */}
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.08em]">Lokasi</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 gap-2 rounded-full bg-surface-lowest px-4 text-xs text-primary shadow-md"
              onClick={detectLocation}
              disabled={locating || submitting}
            >
              {locating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Crosshair className="h-3.5 w-3.5" />
              )}
              Gunakan lokasi saya
            </Button>
          </CardHeader>

          <CardContent className="space-y-3 rounded-xl border border-outline-variant/50 bg-surface-lowest p-1 shadow-[0_2px_12px_rgba(0,109,119,0.05)]">
            <div className="relative h-52 w-full overflow-hidden rounded-lg">
              <LocationPickerMapWrapper
                lat={coords.lat}
                lng={coords.lng}
                onChange={(lat, lng) => {
                  userAdjustedRef.current = true;
                  setCoords((prev) =>
                    prev.lat === lat && prev.lng === lng
                      ? prev
                      : { lat, lng },
                  );
                }}
              />
              {locating && (
                <div className="pointer-events-none absolute inset-0 z-[1100] flex items-start justify-center p-2">
                  <span className="flex items-center gap-1.5 rounded-full border bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Mendeteksi lokasi...
                  </span>
                </div>
              )}
            </div>

            <div className="flex min-h-12 items-center justify-between rounded-lg bg-surface-low px-3 py-2 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Posisi final diambil dari marker
              </span>
              <code className="text-[11px] tabular-nums">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-outline-variant/20 bg-surface/96 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(17,28,44,0.09)] backdrop-blur-md">
        <Button type="submit" disabled={submitting || locating} className="mx-auto flex h-12 w-full max-w-[568px] rounded-lg font-heading text-lg font-semibold">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Mengirim..." : "Kirim laporan"}
        </Button>
      </div>
    </form>
  );
}
