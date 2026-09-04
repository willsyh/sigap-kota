import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface ActivityItem {
  id: string;
  type: "status_change" | "deletion" | "report_created";
  title: string;
  description: string;
  reportId?: string;
  category?: string;
  actorRole: "admin" | "user" | "system";
  timestamp: string;
  meta?: Record<string, unknown>;
}

// Log aktivitas gabungan (perubahan status + penghapusan + pembuatan laporan baru)
export async function GET() {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  if (user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const supabase = createAdminClient();

  // 1. Fetch deletion logs
  const { data: deletionLogs } = await supabase
    .from("deletion_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  // 2. Fetch status logs + report title
  const { data: statusLogs } = await supabase
    .from("status_logs")
    .select(`
      id,
      report_id,
      old_status,
      new_status,
      changed_at,
      reports (
        title,
        category
      )
    `)
    .order("changed_at", { ascending: false })
    .limit(40);

  // 3. Fetch recent reports created
  const { data: recentReports } = await supabase
    .from("reports")
    .select("id, title, category, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const activities: ActivityItem[] = [];

  // Transform deletion logs
  if (deletionLogs) {
    for (const log of deletionLogs) {
      activities.push({
        id: `del-${log.id}`,
        type: "deletion",
        title: log.title || "Laporan Dihapus",
        description: log.reason ? `Alasan: ${log.reason}` : "Laporan dihapus permanen.",
        reportId: log.report_id,
        category: log.category ?? undefined,
        actorRole: (log.role as "admin" | "user") || "user",
        timestamp: log.created_at || new Date().toISOString(),
      });
    }
  }

  // Transform status logs
  if (statusLogs) {
    for (const log of statusLogs) {
      // Type assertion for Supabase nested join
      const reportData = log.reports as unknown as { title?: string; category?: string } | null;
      const reportTitle = reportData?.title || "Laporan";
      const oldStatus = log.old_status || "dibuat";
      const newStatus = log.new_status;

      activities.push({
        id: `status-${log.id}`,
        type: "status_change",
        title: reportTitle,
        description: `Status berubah: ${oldStatus} → ${newStatus}`,
        reportId: log.report_id ?? undefined,
        category: reportData?.category ?? undefined,
        actorRole: "admin",
        timestamp: log.changed_at || new Date().toISOString(),
        meta: { oldStatus, newStatus },
      });
    }
  }

  // Transform new reports
  if (recentReports) {
    for (const rep of recentReports) {
      activities.push({
        id: `rep-${rep.id}`,
        type: "report_created",
        title: rep.title,
        description: "Laporan baru dibuat oleh warga",
        reportId: rep.id,
        category: rep.category,
        actorRole: "user",
        timestamp: rep.created_at || new Date().toISOString(),
      });
    }
  }

  // Sort unified activities chronologically descending
  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return NextResponse.json(activities.slice(0, 50));
}
