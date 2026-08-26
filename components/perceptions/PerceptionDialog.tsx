"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Frown,
  Loader2,
  Meh,
  Send,
  Smile,
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

  const resetForm = () => {
    setSentiment(null);
    setReason(null);
    setNote("");
    setShowDetails(false);
  };

  const handleSubmit = async () => {
    if (!sentiment || pending) return;

    setPending(true);
    try {
      const response = await fetch("/api/persepsi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude,
          longitude,
          sentiment,
          reason: reason ?? null,
          note: note.trim() || null,
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
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-colors ${
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

          {/* Detail opsional: alasan + catatan */}
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
                    Tambah alasan atau catatan (opsional)
                    <ChevronDown className="h-3.5 w-3.5" />
                  </>
                )}
              </button>

              {showDetails && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {PERCEPTION_REASONS.map((value) => {
                      const selected = reason === value;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReason(selected ? null : value)}
                          disabled={pending}
                          className={`rounded-full h-9 px-3 text-xs font-medium border transition-colors ${
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
