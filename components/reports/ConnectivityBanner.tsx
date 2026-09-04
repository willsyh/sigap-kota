"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CloudUpload, RefreshCw, WifiOff } from "lucide-react";
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
  const [isSyncing, setIsSyncing] = useState(false);

  const triggerSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    const count = await getOfflineReportsCount();
    if (count === 0) {
      setPendingCount(0);
      return;
    }

    setIsSyncing(true);
    try {
      await syncOfflineReports();
    } finally {
      setIsSyncing(false);
      const remaining = await getOfflineReportsCount();
      setPendingCount(remaining);
    }
  };

  useEffect(() => {
    // Register Service Worker for Map Tiles Caching
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("Service worker registration skipped:", err);
      });
    }

    // Auto-sync on mount if online and has pending items
    triggerSync();

    const handleOnline = () => {
      triggerSync();
    };

    window.addEventListener("online", handleOnline);
    const interval = setInterval(async () => {
      const count = await getOfflineReportsCount();
      setPendingCount(count);
      // Auto-trigger sync if online and pending items exist
      if (navigator.onLine && count > 0 && !isSyncing) {
        triggerSync();
      }
    }, 4000);

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
          Mode offline aktif. Laporan tersimpan di perangkat dan akan terkirim otomatis saat online.
        </span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="anim-slide-down flex min-h-10 items-center justify-center gap-2 bg-primary/10 border-b border-primary/20 px-4 py-2 text-xs font-medium text-primary">
        <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
        <span>Menyinkronkan laporan offline ke server...</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="anim-slide-down flex min-h-10 items-center justify-between gap-2 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs font-medium text-amber-800 dark:text-amber-300">
        <div className="flex items-center gap-2">
          <CloudUpload className="h-4 w-4 shrink-0 animate-pulse" />
          <span>Ada {pendingCount} laporan offline menunggu koneksi stabil...</span>
        </div>
        <button
          type="button"
          onClick={triggerSync}
          className="rounded-md bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition-colors shrink-0"
        >
          Coba Kirim Ulang
        </button>
      </div>
    );
  }

  return null;
}
