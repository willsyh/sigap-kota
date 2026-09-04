"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Frown,
  ImagePlus,
  Loader2,
  Meh,
  Scan,
  Send,
  Smile,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { createClient } from "@/lib/supabase/client";

const SENTIMENT_ICONS: Record<
  PerceptionSentiment,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  nyaman: Smile,
  biasa: Meh,
  tidak_nyaman: Frown,
};

interface PerceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number;
  longitude: number;
  reportId?: string;
  onSubmitted?: () => void;
}

async function uploadPerceptionPhoto(
  file: File,
): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `perception-photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("report-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return null;
  const { data } = supabase.storage.from("report-photos").getPublicUrl(path);
  return data.publicUrl;
}

export default function PerceptionDialog({
  open,
  onOpenChange,
  latitude,
  longitude,
  reportId,
  onSubmitted,
}: PerceptionDialogProps) {
  const [sentiment, setSentiment] = useState<PerceptionSentiment | null>(null);
  const [reason, setReason] = useState<PerceptionReason | null>(null);
  const [note, setNote] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [pending, setPending] = useState(false);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const analyzedPhotoRef = useRef<string | null>(null);

  const resetForm = () => {
    setSentiment(null);
    setReason(null);
    setNote("");
    setShowDetails(false);
    setPhoto(null);
    setPhotoPreview(null);
    setAiDescription(null);
    setAnalyzing(false);
    analyzedPhotoRef.current = null;
  };

  const analyzePhoto = useCallback(async (file: File) => {
    setAnalyzing(true);
    setAiDescription(null);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/persepsi/analyze", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.reasons?.length > 0) {
        setReason(data.reasons[0]);
        setShowDetails(true);
      }
      if (data.description) {
        setAiDescription(data.description);
      }
    } catch {
      // AI analysis fails silently
    } finally {
      setAnalyzing(false);
    }
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
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    if (analyzedPhotoRef.current !== file.name) {
      analyzedPhotoRef.current = file.name;
      void analyzePhoto(file);
    }
  }

  function handleRemovePhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
    setAiDescription(null);
    analyzedPhotoRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => {
    if (!open) return;
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [open, photoPreview]);

  const handleSubmit = async () => {
    if (!sentiment || pending) return;

    setPending(true);
    try {
      let photoUrl: string | null = null;
      if (photo) {
        photoUrl = await uploadPerceptionPhoto(photo);
        if (!photoUrl) {
          toast.error("Gagal mengunggah foto. Lanjutkan tanpa foto.");
        }
      }

      const response = await fetch("/api/persepsi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude,
          longitude,
          sentiment,
          reason: reason ?? null,
          note: note.trim() || null,
          photo_url: photoUrl,
          report_id: reportId ?? null,
        }),
      });

      if (response.status === 401) {
        toast.info("Masuk untuk berbagi persepsi.");
        onOpenChange(false);
        return;
      }

      if (response.status === 429) {
        toast.error("Terlalu banyak persepsi dikirim. Coba lagi nanti.");
        return;
      }

      if (!response.ok) {
        toast.error("Gagal mengirim persepsi. Coba lagi.");
        return;
      }

      toast.success("Persepsi terkirim.");
      resetForm();
      onOpenChange(false);
      onSubmitted?.();
    } catch {
      toast.error("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">
            Bagaimana rasanya di sini?
          </DialogTitle>
          <DialogDescription>
            Bagikan persepsi anonim tentang suasana di titik ini agar peta lebih
            hidup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pilihan sentimen */}
          <div className="grid grid-cols-3 gap-2">
            {PERCEPTION_SENTIMENTS.map((value) => {
              const meta = PERCEPTION_SENTIMENT_LABELS[value];
              const color = PERCEPTION_SENTIMENT_COLORS[value];
              const Icon = SENTIMENT_ICONS[value];
              const selected = sentiment === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSentiment(value)}
                  disabled={pending}
                  style={
                    selected
                      ? { borderColor: color, backgroundColor: `${color}14` }
                      : undefined
                  }
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-all duration-150 ease-out active:scale-[0.97] ${
                    selected
                      ? "border-2"
                      : "border-outline-variant/35 bg-surface-lowest hover:bg-surface-container"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${selected ? "" : "text-on-surface-variant"}`}
                    style={selected ? { color } : undefined}
                  />
                  <span
                    className={`text-xs font-medium ${
                      selected ? "" : "text-on-surface"
                    }`}
                    style={selected ? { color } : undefined}
                  >
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detail opsional: foto + alasan + catatan */}
          {sentiment && (
            <>
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="flex w-full items-center justify-center gap-1 text-xs font-medium text-on-surface-variant"
              >
                {showDetails ? (
                  <>
                    Sembunyikan detail
                    <ChevronUp className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Tambah foto, alasan, atau catatan (opsional)
                    <ChevronDown className="h-3.5 w-3.5" />
                  </>
                )}
              </button>

              {showDetails && (
                <div className="anim-fade-in space-y-3">
                  {/* Foto opsional */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />

                  {photoPreview ? (
                    <div className="relative overflow-hidden rounded-xl border border-outline-variant/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="Pratinjau foto persepsi"
                        className="aspect-video w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8 rounded-full shadow-lg"
                        onClick={handleRemovePhoto}
                        aria-label="Hapus foto"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                        {analyzing ? (
                          <>
                            <Scan className="h-3 w-3 animate-pulse" />
                            AI menganalisis...
                          </>
                        ) : (
                          <>
                            <Camera className="h-3 w-3" />
                            Foto terpasang
                          </>
                        )}
                      </span>
                      {aiDescription && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-primary/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                          <Sparkles className="h-3 w-3" />
                          {aiDescription}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center gap-3 rounded-xl border border-dashed border-outline-variant/60 bg-surface-low p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <ImagePlus className="h-5 w-5 text-primary" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-on-surface">
                          Tambahkan foto (opsional)
                        </p>
                        <p className="text-xs text-outline">
                          AI akan menganalisis kondisi secara otomatis
                        </p>
                      </div>
                      <Scan className="ml-auto h-4 w-4 text-outline" />
                    </button>
                  )}

                  {/* Alasan */}
                  <div className="flex flex-wrap gap-1.5">
                    {PERCEPTION_REASONS.map((value) => {
                      const selected = reason === value;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReason(selected ? null : value)}
                          disabled={pending}
                          className={`rounded-full h-9 px-3 text-xs font-medium border transition-all duration-150 ease-out active:scale-[0.97] ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-outline-variant/35 bg-surface-lowest text-on-surface-variant hover:bg-surface-container"
                          }`}
                        >
                          {PERCEPTION_REASON_LABELS[value]}
                        </button>
                      );
                    })}
                  </div>

                  <Textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Catatan singkat (opsional)"
                    rows={3}
                    maxLength={280}
                    disabled={pending}
                    className="resize-none rounded-lg border-outline-variant bg-surface-lowest text-sm focus-visible:border-primary"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!sentiment || pending} className="gap-2">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Kirim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
