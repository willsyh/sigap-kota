import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

export default function CivicBrandMark({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15",
        className,
      )}
    >
      <span className="absolute h-8 w-8 rounded-full border-2 border-secondary/80" />
      <MapPin className="relative h-7 w-7" strokeWidth={2.2} />
      <span className="absolute bottom-2.5 h-1.5 w-1.5 rounded-full bg-secondary" />
    </div>
  );
}
