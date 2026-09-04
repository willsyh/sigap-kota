// Offline outbox sync manager
import { toast } from "sonner";
import {
  deleteOfflineReport,
  getPendingOfflineReports,
  PendingOfflineReport,
  updateOfflineReport,
} from "./storage";

let isSyncing = false;

export async function syncSingleReport(report: PendingOfflineReport): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("title", report.title);
    formData.append("description", report.description);
    formData.append("category", report.category);
    formData.append("latitude", String(report.latitude));
    formData.append("longitude", String(report.longitude));

    if (report.photoBlob) {
      const fileName = report.photoName || "offline_photo.jpg";
      const file = new File([report.photoBlob], fileName, { type: report.photoBlob.type || "image/jpeg" });
      formData.append("photo", file);
    }

    const response = await fetch("/api/laporan", {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.id) {
      return {
        success: false,
        error: data?.error || `HTTP ${response.status}`,
      };
    }

    // Success -> remove from offline store
    await deleteOfflineReport(report.id);
    return { success: true, id: data.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network failure";
    return { success: false, error: message };
  }
}

export async function syncOfflineReports(onSuccessItem?: (createdId: string, title: string) => void): Promise<{ synced: number; failed: number }> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  if (isSyncing) {
    return { synced: 0, failed: 0 };
  }

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const pendingList = await getPendingOfflineReports();
    if (!pendingList || pendingList.length === 0) {
      return { synced: 0, failed: 0 };
    }

    toast.info(`Mengirim ${pendingList.length} laporan yang tersimpan offline...`, {
      id: "offline-syncing",
    });

    for (const item of pendingList) {
      const result = await syncSingleReport(item);
      if (result.success && result.id) {
        synced++;
        if (onSuccessItem) {
          onSuccessItem(result.id, item.title);
        }
      } else {
        failed++;
        await updateOfflineReport({
          ...item,
          retryCount: item.retryCount + 1,
          lastError: result.error,
        });
      }
    }

    toast.dismiss("offline-syncing");

    if (synced > 0) {
      toast.success(`${synced} laporan offline berhasil terkirim ke server!`);
    }
    if (failed > 0) {
      toast.warning(`${failed} laporan offline gagal terkirim (akan dicoba lagi nanti).`);
    }
  } catch (err) {
    console.error("Offline sync error:", err);
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}
