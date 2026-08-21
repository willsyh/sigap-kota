"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { Report } from "@/lib/types";

interface MapViewProps {
  reports: Report[];
  selectedReportId?: string | null;
  onSelectReport?: (report: Report) => void;
  center?: [number, number];
  zoom?: number;
}

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg border bg-muted/20">
      <div className="space-y-3 text-center">
        <Skeleton className="mx-auto h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-48" />
        <p className="text-xs text-muted-foreground">Memuat peta interaktif...</p>
      </div>
    </div>
  ),
});

export default function MapView(props: MapViewProps) {
  return <MapComponent {...props} />;
}
