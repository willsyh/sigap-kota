import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Ganti foto sesudah oleh admin tanpa mengubah status laporan.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Gunakan multipart form data" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Form data tidak valid" }, { status: 400 });
  }

  const file = formData.get("photo_after");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Foto sesudah wajib disertakan" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("reports")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `after/${id}-${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("report-photos")
    .upload(path, arrayBuffer, { contentType: file.type });

  if (uploadError) {
    console.error("PATCH foto-after upload error:", uploadError.message);
    return NextResponse.json(
      { error: "Gagal upload foto", detail: uploadError.message },
      { status: 500 },
    );
  }

  const { data: urlData } = supabase.storage.from("report-photos").getPublicUrl(path);

  // Hanya update kolom foto; status tidak diubah.
  const { data, error: updateError } = await supabase
    .from("reports")
    .update({ photo_after_url: urlData.publicUrl })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("PATCH foto-after update error:", updateError.message, updateError.code);
    return NextResponse.json(
      { error: "Gagal memperbarui foto", detail: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
