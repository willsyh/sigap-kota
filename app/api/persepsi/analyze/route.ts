import { NextRequest, NextResponse } from "next/server";

import { PERCEPTION_REASONS } from "@/lib/constants/perceptions";
import type { PerceptionReason } from "@/lib/supabase/types";

const ANALYZE_PROMPT = `Kamu adalah asisten analisis persepsi warga kota. Analisis foto berikut dan tentukan kondisi lingkungan yang terlihat.

Foto ini diambil oleh warga untuk berbagi persepsi tentang suatu lokasi.

Tentukan alasan persepsi yang paling sesuai dari daftar berikut:
- kotor: terlihat kotor, sampah, atau tidak terawat
- bising: terlihat ramai, banyak kendaraan, atau aktivitas padat
- jalan_buruk: kondisi jalan rusak, berlubang, atau tidak rata
- ramai: terlalu ramai, padat, atau sesak
- kurang_penerangan: area gelap, kurang lampu, atau minim pencahayaan
- kurang_aman: terlihat tidak aman, sepi, atau mencurigakan
- lainnya: tidak termasuk kategori di atas

Balas HANYA JSON valid tanpa teks lain:
{"reasons":["reason1","reason2"],"confidence":0.8,"description":"deskripsi singkat dalam bahasa Indonesia"}

- reasons: array alasan yang terdeteksi (maksimal 2, urutkan dari yang paling relevan)
- confidence: tingkat keyakinan 0-1
- description: deskripsi singkat kondisi yang terlihat (maksimal 1 kalimat)

Jika foto tidak relevan atau tidak dapat dianalisis, kembalikan:
{"reasons":[],"confidence":0,"description":" Foto tidak dapat dianalisis"}`;

function parseAnalysis(raw: string): {
  reasons: PerceptionReason[];
  confidence: number;
  description: string;
} | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as {
      reasons?: unknown;
      confidence?: unknown;
      description?: unknown;
    };
    const validReasons = Array.isArray(parsed.reasons)
      ? (parsed.reasons as unknown[])
          .filter((r): r is PerceptionReason =>
            typeof r === "string" &&
            (PERCEPTION_REASONS as readonly string[]).includes(r),
          )
          .slice(0, 2)
      : [];
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0;
    const description =
      typeof parsed.description === "string" && parsed.description.trim()
        ? parsed.description.trim()
        : "";
    return { reasons: validReasons, confidence, description };
  } catch {
    return null;
  }
}

async function fileToBase64(photo: File): Promise<{ base64: string; mime: string }> {
  const buffer = Buffer.from(await photo.arrayBuffer());
  return { base64: buffer.toString("base64"), mime: photo.type || "image/jpeg" };
}

async function analyzeWithGemini(
  base64: string,
  mime: string,
): Promise<{ reasons: PerceptionReason[]; confidence: number; description: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY tidak diset");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: ANALYZE_PROMPT },
              { inline_data: { mime_type: mime, data: base64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0, maxOutputTokens: 200 },
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const parsed = parseAnalysis(text);
  if (!parsed) throw new Error("Gemini: respons tidak dapat diparse");
  return parsed;
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Body harus berupa FormData" },
      { status: 400 },
    );
  }

  const photo = formData.get("photo");
  if (!photo || !(photo instanceof File) || photo.size === 0) {
    return NextResponse.json(
      { error: "Foto diperlukan untuk analisis" },
      { status: 400 },
    );
  }

  if (photo.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Ukuran foto maksimal 5MB" },
      { status: 400 },
    );
  }

  try {
    const { base64, mime } = await fileToBase64(photo);
    const result = await analyzeWithGemini(base64, mime);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { reasons: [], confidence: 0, description: "" },
      { status: 200 },
    );
  }
}
