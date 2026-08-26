"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, CircleDot, Copy, Crosshair, Ellipsis, ImagePlus, Landmark, Loader2, LogIn, MapPin, ThumbsUp, Trash2, UserPlus, Waves, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LocationPickerMapWrapper from "@/components/reports/LocationPickerMapWrapper";
import PerceptionDialog from "@/components/perceptions/PerceptionDialog";
import {
  CATEGORY_LABELS,
  REPORT_CATEGORIES,
  STATUS_META,
} from "@/lib/constants/reports";
import { createClient } from "@/lib/supabase/client";
import type { ReportCategory, ReportStatus } from "@/lib/types";

// Default: area Pamulang
const DEFAULT_COORDS = { lat: -6.3458, lng: 106.7394 };

const LOGIN_NEXT_PATH = "/laporan/baru";

type AuthGateState = "checking" | "authenticated" | "anonymous";

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
  const [authGate, setAuthGate] = useState<AuthGateState>("checking");
  // Status visual dropzone saat file foto diseret di atasnya (drag-and-drop).
  const [dropActive, setDropActive] = useState(false);
  // Diisi setelah submit sukses: menampilkan layar sukses singkat sebelum
  // redirect ke halaman detail laporan.
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  // Dialog persepsi pasca-laporan: muncul sekali setelah laporan berhasil
  // dibuat, sebelum redirect ke halaman detail.
  const [perceptionOpen, setPerceptionOpen] = useState(false);
  const [perceptionReportId, setPerceptionReportId] = useState<string | null>(null);
  const perceptionShownRef = useRef(false);
  const redirectedRef = useRef(false);

  // Auth-gate di pintu masuk: pengguna anonim melihat kartu login, bukan
  // form yang berakhir dengan error 401 saat submit.
  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!cancelled) {
          setAuthGate(data.user ? "authenticated" : "anonymous");
        }
      })
      .catch(() => {
        if (!cancelled) setAuthGate("anonymous");
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  // Drag-and-drop foto ke dropzone: validasi sama dengan pemilihan manual.
  function handleDropzoneDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDropActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    const mockEvent = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handlePhotoChange(mockEvent);
  }

  // Redirect ke halaman detail laporan. Idempoten: dipanggil baik saat dialog
  // persepsi ditutup/dilewati maupun setelah persepsi terkirim.
  function completeRedirect(target: string) {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    setPerceptionOpen(false);
    router.push(target);
    router.refresh();
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

      toast.success("Laporan berhasil dikirim.");
      const target = `/laporan/${data.id}`;
      setRedirectTarget(target);

      // Tampilkan dialog persepsi sekali per submit sebelum redirect.
      // Jika data tidak lengkap (koordinat/id tidak valid), langsung redirect
      // agar pengguna tidak pernah terjebak di layar sukses.
      if (
        !perceptionShownRef.current &&
        typeof data.id === "string" &&
        Number.isFinite(coords.lat) &&
        Number.isFinite(coords.lng)
      ) {
        perceptionShownRef.current = true;
        setPerceptionReportId(data.id);
        setPerceptionOpen(true);
      } else {
        completeRedirect(target);
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  function sectionHeader(step: number, title: string, hint: string, done = false) {
    return (
      <div className="flex items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${done ? "bg-primary text-primary-foreground" : "border-2 border-outline-variant/50 bg-surface-lowest text-outline"}`}>
          {done ? <Check className="h-4 w-4" /> : step}
        </span>
        <div>
          <p className="font-heading text-base font-bold leading-tight text-on-surface">{title}</p>
          <p className="text-xs text-outline">{hint}</p>
        </div>
      </div>
    );
  }

  const canSubmit = Boolean(title.trim() && category && !submitting);

  if (authGate === "checking") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Memuat">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (authGate === "anonymous") {
    return (
      <Card className="anim-fade-up rounded-2xl border-outline-variant/35 bg-surface-lowest shadow-[0_8px_32px_rgba(0,83,91,0.08)]">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:p-10">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-7 w-7 text-primary" />
          </span>
          <div className="space-y-1.5">
            <h2 className="font-heading text-xl font-bold text-on-surface">Masuk untuk melapor</h2>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-on-surface-variant">
              Laporan dipasangkan dengan akun Anda agar dapat dipantau
              perkembangannya dan dilindungi dari laporan palsu.
            </p>
          </div>
          <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link
              href={`/auth/login?next=${encodeURIComponent(LOGIN_NEXT_PATH)}`}
              className={buttonVariants({ className: "h-11 rounded-xl px-6 font-semibold" })}
            >
              <LogIn className="h-4 w-4" />
              Masuk
            </Link>
            <Link
              href={`/auth/register?next=${encodeURIComponent(LOGIN_NEXT_PATH)}`}
              className={buttonVariants({ variant: "outline", className: "h-11 rounded-xl px-6 font-semibold" })}
            >
              <UserPlus className="h-4 w-4" />
              Daftar
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (redirectTarget) {
    return (
      <>
        <Card className="anim-fade-up rounded-2xl border-primary/30 bg-surface-lowest shadow-[0_8px_32px_rgba(0,83,91,0.08)]">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:p-10">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-7 w-7 text-primary" />
            </span>
            <div className="space-y-1.5">
              <h2 className="font-heading text-xl font-bold text-on-surface">Laporan terkirim</h2>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-on-surface-variant">
                Terima kasih. Laporan Anda masuk antrean tinjauan.
                Mengalihkan ke halaman laporan...
              </p>
            </div>
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          </CardContent>
        </Card>

        {/* Dialog persepsi pasca-laporan: menutup/membatalkan berarti melewati
            dan langsung redirect; submit sukses juga melanjutkan redirect. */}
        {perceptionReportId && (
          <PerceptionDialog
            open={perceptionOpen}
            onOpenChange={(open) => {
              setPerceptionOpen(open);
              if (!open) completeRedirect(redirectTarget);
            }}
            latitude={coords.lat}
            longitude={coords.lng}
            reportId={perceptionReportId}
            onSubmitted={() => completeRedirect(redirectTarget)}
          />
        )}
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-32">
      {/* Duplicate detection banner */}
      {checkingDuplicates && candidates.length === 0 && (
        <div className="anim-slide-down flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-low px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs font-medium text-on-surface-variant">Memeriksa laporan serupa di sekitar lokasi...</span>
        </div>
      )}

      {candidates.length > 0 && (
        <Card className="anim-fade-up overflow-hidden rounded-2xl border-secondary/30 shadow-[0_2px_12px_rgba(142,78,20,0.08)]">
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/15">
                <Copy className="h-4 w-4 text-secondary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-on-surface">Laporan serupa ditemukan</p>
                <p className="text-xs leading-relaxed text-on-surface-variant">
                  Ada laporan aktif dengan kategori dan lokasi yang mirip.
                  Mendukung laporan yang ada membantu mempercepat penanganan.
                </p>
              </div>
            </div>

            <ul className="divide-y overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-lowest">
              {candidates.map((candidate) => {
                const voted = votedIds.has(candidate.id);
                const voting = votingId === candidate.id;

                return (
                  <li key={candidate.id} className="flex items-center justify-between gap-3 p-3.5">
                    <div className="min-w-0 space-y-1.5">
                      <p className="truncate text-sm font-semibold text-on-surface">{candidate.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                        <Badge variant={STATUS_META[candidate.status as ReportStatus]?.badgeVariant ?? "outline"} className="px-1.5 py-0 text-xs">
                          {STATUS_META[candidate.status as ReportStatus]?.label ?? candidate.status}
                        </Badge>
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{candidate.vote_count ?? 0}</span>
                        <span>~{candidate.distance_meters} m dari lokasi</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant={voted ? "secondary" : "outline"}
                      size="sm"
                      className="h-9 shrink-0 gap-1 rounded-full px-3.5 text-xs"
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
                        "Dukung"
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>

            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" className="h-9 rounded-full text-xs font-semibold text-primary" onClick={handleDismissDuplicates}>
                Tetap lanjut buat laporan baru
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Foto */}
      <section className={`rounded-2xl border bg-surface-lowest p-4 shadow-[0_2px_12px_rgba(0,109,119,0.05)] transition-colors sm:p-5 ${photo ? "border-primary/30" : "border-outline-variant/35"}`}>
        {sectionHeader(1, "Foto Bukti", "Foto membantu petugas memahami masalah", Boolean(photo))}

        <input ref={fileInputRef} id="photo" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />

        {photoPreview ? (
          <div className="relative mt-4 overflow-hidden rounded-xl border border-outline-variant/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="Pratinjau foto" className="aspect-video w-full object-cover" />
            <Button type="button" variant="destructive" size="icon" className="absolute right-2 top-2 h-10 w-10 rounded-full shadow-lg" onClick={handleRemovePhoto} aria-label="Hapus foto">
              <X className="h-4 w-4" />
            </Button>
            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
              <ImagePlus className="h-3 w-3" />Foto terpasang
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDropActive(true);
            }}
            onDragLeave={() => setDropActive(false)}
            onDrop={handleDropzoneDrop}
            className={`mt-4 flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-surface-low transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              dropActive
                ? "border-primary bg-primary/10"
                : "border-outline-variant/60 hover:border-primary/50 hover:bg-primary/5"
            }`}
          >
            <span className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-150 ease-out ${dropActive ? "bg-primary/20" : "bg-primary/10"}`}><ImagePlus className="h-6 w-6 text-primary" /></span>
            <span className="text-sm font-semibold text-on-surface">{dropActive ? "Lepaskan foto di sini" : "Tambahkan foto"}</span>
            <span className="text-xs text-outline">JPEG, PNG, atau WebP - maks 5MB</span>
          </button>
        )}
      </section>

      {/* Step 2: Kategori */}
      <section className={`rounded-2xl border bg-surface-lowest p-4 shadow-[0_2px_12px_rgba(0,109,119,0.05)] transition-colors sm:p-5 ${category ? "border-primary/30" : "border-outline-variant/35"}`}>
        {sectionHeader(2, "Kategori Masalah", "Pilih jenis masalah yang kamu temukan", Boolean(category))}

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {REPORT_CATEGORIES.map((item) => {
            const Icon = item === "jalan_rusak" ? CircleDot : item === "sampah" ? Trash2 : item === "banjir" ? Waves : item === "fasilitas_umum" ? Landmark : Ellipsis;
            const active = category === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={active}
                className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-3.5 text-center transition-all duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-primary bg-primary/5 shadow-sm" : "border-outline-variant/40 bg-surface-low hover:border-outline-variant hover:bg-surface-container"}`}
              >
                {active && (
                  <span className="anim-check-in absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <Icon className={`h-6 w-6 ${active ? "text-primary" : "text-on-surface-variant"}`} />
                <span className={`text-xs font-semibold leading-tight ${active ? "text-primary" : "text-on-surface-variant"}`}>{CATEGORY_LABELS[item]}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 3: Detail */}
      <section className={`rounded-2xl border bg-surface-lowest p-4 shadow-[0_2px_12px_rgba(0,109,119,0.05)] transition-colors sm:p-5 ${title.trim() ? "border-primary/30" : "border-outline-variant/35"}`}>
        {sectionHeader(3, "Detail Laporan", "Judul dan penjelasan masalah", Boolean(title.trim()))}

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-on-surface-variant">Judul laporan</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Jalan berlubang di depan sekolah"
              required
              maxLength={120}
              className="h-12 rounded-xl border-outline-variant/50 bg-surface-low text-base focus-visible:border-primary"
            />
            <p className="text-right text-xs tabular-nums text-outline">{title.length}/120</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-on-surface-variant">Deskripsi <span className="font-normal text-outline">(opsional)</span></Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kondisi, dampak, dan waktu kejadian..."
              rows={4}
              maxLength={1000}
              className="resize-none rounded-xl border-outline-variant/50 bg-surface-low text-base leading-relaxed focus-visible:border-primary"
            />
            <p className="text-right text-xs tabular-nums text-outline">{description.length}/1000</p>
          </div>
        </div>
      </section>

      {/* Step 4: Lokasi */}
      <section className="rounded-2xl border border-outline-variant/35 bg-surface-lowest p-4 shadow-[0_2px_12px_rgba(0,109,119,0.05)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          {sectionHeader(4, "Titik Lokasi", "Geser marker atau pakai GPS")}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0 gap-1.5 rounded-full px-3.5 text-xs font-semibold text-primary"
            onClick={detectLocation}
            disabled={locating || submitting}
          >
            {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
            Gunakan lokasi saya
          </Button>
        </div>

        <CardContent className="space-y-3 p-0 pt-4">
          <div className="relative h-52 w-full overflow-hidden rounded-xl border border-outline-variant/40">
            <LocationPickerMapWrapper
              lat={coords.lat}
              lng={coords.lng}
              onChange={(lat, lng) => {
                userAdjustedRef.current = true;
                setCoords((prev) => (prev.lat === lat && prev.lng === lng ? prev : { lat, lng }));
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

          <div className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-surface-low px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              Posisi marker di peta
            </span>
            <code className="shrink-0 text-xs tabular-nums text-on-surface-variant">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </code>
          </div>
        </CardContent>
      </section>

      {/* Sticky submit bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/25 bg-surface/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(17,28,44,0.09)] backdrop-blur-md">
        <div className="mx-auto max-w-[600px]">
          {!canSubmit && !submitting && (
            <p className="mb-2 text-center text-xs text-outline">
              {!category ? "Pilih kategori dan isi judul untuk mengirim laporan" : "Isi judul laporan untuk melanjutkan"}
            </p>
          )}
          <Button type="submit" disabled={!canSubmit} className="flex h-12 w-full rounded-xl font-heading text-base font-bold tracking-wide">
            {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {submitting ? "Mengirim laporan..." : "Kirim Laporan"}
          </Button>
        </div>
      </div>
    </form>
  );
}
