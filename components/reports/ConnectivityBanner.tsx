"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CloudUpload, WifiOff } from "lucide-react";
import { getOfflineReportsCount } from "@/lib/offline/storage";
import { syncOfflineReports } from "@/lib/offline/sync";

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
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = async () => {
    const count = await getOfflineReportsCount();
    setPendingCount(count);
  };

  useEffect(() => {
    // Register Service Worker for Map Tiles Caching
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("Service worker registration skipped:", err);
      });
    }

    refreshCount();

    const handleOnline = () => {
      syncOfflineReports().finally(() => {
        refreshCount();
      });
    };

    window.addEventListener("online", handleOnline);
    // Interval check for pending outbox items
    const interval = setInterval(refreshCount, 3000);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, []);

  if (offline) {
    return (
      <div className="anim-slide-down flex min-h-10 items-center justify-center gap-2 bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs font-medium text-amber-900 dark:text-amber-200">
        <WifiOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          Mode offline aktif. Laporan tetap bisa dibuat dan akan disimpan di memori perangkat.
        </span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="anim-slide-down flex min-h-10 items-center justify-between gap-2 bg-primary/10 border-b border-primary/20 px-4 py-2 text-xs font-medium text-primary">
        <div className="flex items-center gap-2">
          <CloudUpload className="h-4 w-4 shrink-0 animate-pulse" />
          <span>Ada {pendingCount} laporan offline menunggu sinkronisasi.</span>
        </div>
        <button
          type="button"
          onClick={() => {
            syncOfflineReports().finally(refreshCount);
          }}
          className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Sinkronkan Sekarang
        </button>
      </div>
    );
  }

  return null;
}
