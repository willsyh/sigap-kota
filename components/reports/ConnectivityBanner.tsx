"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return !navigator.onLine;
}

export default function ConnectivityBanner() {
  const offline = useSyncExternalStore(subscribe, getSnapshot, () => false);
  if (!offline) return null;
  return (
    <div className="anim-slide-down flex min-h-10 items-center justify-center gap-2 bg-error-container px-4 py-2 text-center text-xs text-on-error-container">
      <WifiOff className="h-4 w-4 shrink-0" />
      Anda sedang offline. Sambungkan kembali internet sebelum mengirim laporan.
    </div>
  );
}
