import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Log penghapusan laporan: hanya admin yang boleh melihat.
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

  const { data, error } = await supabase
    .from("deletion_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("GET deletion_logs error:", error.message);
    return NextResponse.json(
      { error: "Gagal memuat log penghapusan", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
