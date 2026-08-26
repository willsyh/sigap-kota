"use client";

import Link from "next/link";
import { Clock3, ImageOff, MapPin, ThumbsUp } from "lucide-react";

import { CATEGORY_LABELS, STATUS_META } from "@/lib/constants/reports";
import { usePlaceName } from "@/lib/utils/geocode";
import type { Report } from "@/lib/types";

interface ReportCardProps { report: Report; }

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default function ReportCard({ report }: ReportCardProps) {
  const statusMeta = STATUS_META[report.status];
  const placeName = usePlaceName(report.latitude, report.longitude);
  const locationLabel = placeName ?? `${report.latitude.toFixed(3)}, ${report.longitude.toFixed(3)}`;

  return (
    <Link href={`/laporan/${report.id}`} className="group flex min-h-28 cursor-pointer gap-4 rounded-xl border border-outline-variant/30 bg-surface-lowest p-3 shadow-[0_2px_12px_rgba(0,109,119,0.05)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {report.photo_url ? (
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={report.photo_url} alt={report.title} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
        </div>
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-surface-container text-outline-variant"><ImageOff className="h-8 w-8" /></div>
      )}
      <div className="min-w-0 flex-1 py-0.5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="max-w-[55%] truncate rounded bg-tertiary/10 px-2 py-1 text-xs font-bold uppercase tracking-[0.08em] text-tertiary">{CATEGORY_LABELS[report.category]}</span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-outline"><Clock3 className="h-3.5 w-3.5" />{formatDate(report.created_at)}</span>
        </div>
        <h2 className="truncate text-base font-semibold text-on-surface group-hover:text-primary">{report.title}</h2>
        <div className="mt-2 flex min-w-0 items-center gap-2 text-xs">
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 ${statusMeta.pillClassName}`}><span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClassName}`} />{statusMeta.label}</span>
          <span className="text-outline-variant">•</span>
          <span className="flex min-w-0 items-center gap-1 truncate text-outline" title={locationLabel}><MapPin className="h-3.5 w-3.5 shrink-0" />{locationLabel}</span>
        </div>
        <span className="mt-2 flex items-center gap-1 text-xs font-medium text-secondary"><ThumbsUp className="h-4 w-4" />{report.vote_count ?? 0} dukungan</span>
      </div>
    </Link>
  );
}
