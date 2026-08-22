import { Calendar, MapPin, ThumbsUp } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  STATUS_BADGE_VARIANTS,
} from "@/lib/constants/reports";
import type { Report } from "@/lib/types";

interface ReportCardProps {
  report: Report;
}

export default function ReportCard({ report }: ReportCardProps) {
  return (
    <Link href={`/laporan/${report.id}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        {/* Thumbnail */}
        {report.photo_url && (
          <div className="aspect-video w-full overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={report.photo_url}
              alt={report.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}

        <CardHeader className="p-3 pb-1.5">
          {/* Category + Status badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0"
              style={{ borderColor: CATEGORY_COLORS[report.category], color: CATEGORY_COLORS[report.category] }}
            >
              {CATEGORY_LABELS[report.category]}
            </Badge>
            <Badge
              variant={STATUS_BADGE_VARIANTS[report.status]}
              className="text-[10px] px-1.5 py-0"
            >
              {STATUS_LABELS[report.status]}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="mt-1.5 text-sm font-semibold leading-snug line-clamp-2">
            {report.title}
          </h3>
        </CardHeader>

        <CardContent className="p-3 pt-0">
          {report.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {report.description}
            </p>
          )}

          {/* Footer meta */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                {report.vote_count ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {report.latitude.toFixed(3)}, {report.longitude.toFixed(3)}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {report.created_at
                ? new Date(report.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "-"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
