import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

interface CivicBrandMarkProps {
  className?: string;
  size?: "sm" | "md";
}

const SIZE_CLASSES = {
  sm: {
    box: "h-9 w-9",
    ring: "h-5 w-5",
    icon: "h-4 w-4",
    dot: "bottom-1.5 h-1 w-1",
  },
  md: {
    box: "h-14 w-14",
    ring: "h-8 w-8",
    icon: "h-7 w-7",
    dot: "bottom-2.5 h-1.5 w-1.5",
  },
} as const;

export default function CivicBrandMark({
  className,
  size = "md",
}: CivicBrandMarkProps) {
  const s = SIZE_CLASSES[size];
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15",
        s.box,
        className,
      )}
    >
      <span className={cn("absolute rounded-full border-2 border-secondary/80", s.ring)} />
      <MapPin className={cn("relative", s.icon)} strokeWidth={2.2} />
      <span className={cn("absolute rounded-full bg-secondary", s.dot)} />
    </div>
  );
}