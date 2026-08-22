"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Crosshair, ImagePlus, Loader2, MapPin, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LocationPickerMapWrapper from "@/components/reports/LocationPickerMapWrapper";
import { CATEGORY_LABELS, REPORT_CATEGORIES } from "@/lib/constants/reports";
import type { ReportCategory } from "@/lib/types";

// Default: area Pamulang
const DEFAULT_COORDS = { lat: -6.3458, lng: 106.7394 };

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
    navigator.geolocation.getCurrentPosition(
      (position) => {
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
  }, []);

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Kolom kiri: detail laporan */}
        <Card className="lg:col-span-3">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Detail Laporan</CardTitle>
            <CardDescription>
              Jelaskan masalah fasilitas umum yang kamu temukan.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 p-4 pt-0">
            <div className="space-y-2">
              <Label htmlFor="title">Judul *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Jalan berlubang di depan sekolah"
                required
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ReportCategory)}
                required
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan kondisi, dampak, dan waktu kejadian..."
                rows={4}
                maxLength={1000}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Foto</Label>

              {photoPreview ? (
                <div className="relative overflow-hidden rounded-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Pratinjau foto"
                    className="aspect-video w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7"
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
                  className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed text-muted-foreground transition-colors hover:bg-accent/40"
                >
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-xs">
                    Klik untuk unggah foto (JPEG/PNG/WebP, maks 5MB)
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
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0 p-4 pb-2">
            <div className="space-y-1.5">
              <CardTitle className="text-sm">Lokasi Kejadian</CardTitle>
              <CardDescription>
                Geser marker atau klik peta untuk koreksi posisi.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={detectLocation}
              disabled={locating || submitting}
            >
              {locating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Crosshair className="h-3.5 w-3.5" />
              )}
              Deteksi
            </Button>
          </CardHeader>

          <CardContent className="space-y-3 p-4 pt-0">
            <div className="relative h-64 w-full sm:h-72">
              {locating ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <LocationPickerMapWrapper
                  lat={coords.lat}
                  lng={coords.lng}
                  onChange={(lat, lng) =>
                    setCoords((prev) =>
                      prev.lat === lat && prev.lng === lng
                        ? prev
                        : { lat, lng },
                    )
                  }
                />
              )}
            </div>

            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
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

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting || locating}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Mengirim..." : "Kirim Laporan"}
        </Button>
        {submitting && (
          <span className="text-xs text-muted-foreground">
            Mengunggah foto dan menyimpan laporan...
          </span>
        )}
      </div>
    </form>
  );
}
