import Link from "next/link";
import { Clock3, ImageOff, MapPin, ThumbsUp } from "lucide-react";

import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/constants/reports";
import type { Report, ReportStatus } from "@/lib/types";

interface ReportCardProps { report: Report; }

const statusStyles: Record<ReportStatus, { pill: string; dot: string }> = {
  dilaporkan: { pill: "bg-surface-container text-on-surface-variant", dot: "bg-outline" },
  diproses: { pill: "bg-secondary-container/20 text-on-secondary-container", dot: "bg-secondary" },
  selesai: { pill: "bg-tertiary/10 text-tertiary", dot: "bg-tertiary" },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default function ReportCard({ report }: ReportCardProps) {
  const statusStyle = statusStyles[report.status];
  return (
    <Link href={`/laporan/${report.id}`} className="group flex min-h-28 cursor-pointer gap-4 rounded-xl border border-outline-variant/30 bg-surface-lowest p-3 shadow-[0_2px_12px_rgba(0,109,119,0.05)] transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
          <span className="max-w-[55%] truncate rounded bg-tertiary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-tertiary">{CATEGORY_LABELS[report.category]}</span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-outline"><Clock3 className="h-3.5 w-3.5" />{formatDate(report.created_at)}</span>
        </div>
        <h2 className="truncate text-base font-semibold text-on-surface group-hover:text-primary">{report.title}</h2>
        <div className="mt-2 flex min-w-0 items-center gap-2 text-[11px]">
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 ${statusStyle.pill}`}><span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />{STATUS_LABELS[report.status]}</span>
          <span className="text-outline-variant">•</span>
          <span className="flex min-w-0 items-center gap-1 truncate text-outline"><MapPin className="h-3.5 w-3.5 shrink-0" />{report.latitude.toFixed(3)}, {report.longitude.toFixed(3)}</span>
        </div>
        <span className="mt-2 flex items-center gap-1 text-xs font-medium text-secondary"><ThumbsUp className="h-4 w-4" />{report.vote_count ?? 0} dukungan</span>
      </div>
    </Link>
  );
}
