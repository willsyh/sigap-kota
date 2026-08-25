import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ReportStatus } from "@/lib/types";

export interface DeletedReportItem {
  log_id: string;
  report_id: string;
  title: string | null;
  category: string | null;
  reason: string | null;
  deleted_by_role: string;
  deleted_by_email: string | null;
  deleted_at: string | null;
  current_status: ReportStatus | null;
}

// Daftar laporan terhapus (soft-deleted). Admin only.
export async function GET() {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const isAdmin =
    user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin";

  if (!isAdmin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const supabase = createAdminClient();

  // Ambil semua log penghapusan, urut terbaru
  const { data: logs, error: logsError } = await supabase
    .from("deletion_logs")
    .select("id, report_id, title, category, reason, role, deleted_by, created_at")
    .order("created_at", { ascending: false });

  if (logsError) {
    console.error("GET deletion_logs error:", logsError.message);
    return NextResponse.json({ error: "Gagal memuat laporan terhapus" }, { status: 500 });
  }

  // Ambil laporan yang sedang soft-deleted untuk cek status pemulihan
  const { data: deletedReports, error: reportsError } = await supabase
    .from("reports")
    .select("id, status, deleted_at")
    .not("deleted_at", "is", null);

  if (reportsError) {
    console.error("GET deleted reports error:", reportsError.message);
    return NextResponse.json({ error: "Gagal memuat laporan terhapus" }, { status: 500 });
  }

  const stillDeleted = new Map(
    (deletedReports ?? []).map((r) => [r.id as string, r.status as ReportStatus]),
  );

  // Resolve email penghapus via admin auth API
  const userIds = [...new Set((logs ?? []).map((l) => l.deleted_by).filter(Boolean))] as string[];
  const emailById = new Map<string, string>();
  for (const uid of userIds) {
    const { data: userData } = await supabase.auth.admin.getUserById(uid);
    if (userData?.user?.email) emailById.set(uid, userData.user.email);
  }

  const items: DeletedReportItem[] = (logs ?? []).map((log) => ({
    log_id: log.id,
    report_id: log.report_id,
    title: log.title,
    category: log.category,
    reason: log.reason,
    deleted_by_role: log.role,
    deleted_by_email: emailById.get(log.deleted_by ?? "") ?? null,
    deleted_at: log.created_at,
    // null berarti sudah dipulihkan
    current_status: stillDeleted.get(log.report_id) ?? null,
  }));

  return NextResponse.json(items);
}
