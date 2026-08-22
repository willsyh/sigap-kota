"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const LocationPickerMap = dynamic(
  () => import("@/components/reports/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-md border bg-muted/20">
        <Skeleton className="h-full w-full" />
      </div>
    ),
  },
);

export default function LocationPickerMapWrapper(props: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  return <LocationPickerMap {...props} />;
}
