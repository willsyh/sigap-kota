/**
 * Verifikasi foto vs judul/deskripsi laporan (anti-spam).
 * Chain provider vision gratis: Gemini -> Groq -> Mistral.
 * Jika semua gagal / tidak ada foto, kembalikan { verdict: "unsure" }.
 *
 * Designed untuk dipanggil server-side saat POST /api/laporan, dengan file
 * foto yang sudah tersedia di server (tidak perlu lewat client base64).
 */

export type AiVerdict = "match" | "mismatch" | "unsure";

export interface AiVerifyResult {
  verdict: AiVerdict;
  reason: string;
  provider: string | null;
}

const VERIFY_PROMPT = `Kamu moderator konten laporan fasilitas umum. Tentukan apakah foto ini KONSISTEN dengan judul dan deskripsi laporan berikut.

JUDUL: {title}
DESKRIPSI: {description}

Kategori yang valid: jalan rusak, sampah, banjir, fasilitas umum, lainnya.

Balas HANYA JSON valid tanpa teks lain:
{"verdict":"match"|"mismatch"|"unsure","reason":"penjelasan singkat dalam bahasa Indonesia maksimal 1 kalimat"}

- "match": foto mendukung klaim laporan.
- "mismatch": foto jelas TIDAK relevan (misal selfie, meme, screenshot tidak terkait).
- "unsure": ragu, kualitas buruk, atau tidak dapat dipastikan.`;

function buildPrompt(title: string, description: string): string {
  return VERIFY_PROMPT.replace("{title}", title).replace(
    "{description}",
    description || "(tidak diisi)",
  );
}

function parseVerdict(raw: string): AiVerifyResult | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as {
      verdict?: unknown;
      reason?: unknown;
    };
    if (
      parsed.verdict === "match" ||
      parsed.verdict === "mismatch" ||
      parsed.verdict === "unsure"
    ) {
      return {
        verdict: parsed.verdict,
        reason:
          typeof parsed.reason === "string" && parsed.reason.trim()
            ? parsed.reason.trim()
            : "",
        provider: null,
      };
    }
  } catch {
    // bukan JSON valid
  }
  return null;
}

async function fileToBase64(photo: File): Promise<{ base64: string; mime: string }> {
  const buffer = Buffer.from(await photo.arrayBuffer());
  return { base64: buffer.toString("base64"), mime: photo.type || "image/jpeg" };
}

async function verifyWithGemini(
  base64: string,
  mime: string,
  prompt: string,
): Promise<AiVerifyResult> {
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
              { text: prompt },
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
  const parsed = parseVerdict(text);
  if (!parsed) throw new Error("Gemini: respons tidak dapat diparse");
  return { ...parsed, provider: "gemini" };
}

async function verifyWithGroq(
  base64: string,
  mime: string,
  prompt: string,
): Promise<AiVerifyResult> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY tidak diset");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 200,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const parsed = parseVerdict(data.choices?.[0]?.message?.content ?? "");
  if (!parsed) throw new Error("Groq: respons tidak dapat diparse");
  return { ...parsed, provider: "groq" };
}

async function verifyWithMistral(
  base64: string,
  mime: string,
  prompt: string,
): Promise<AiVerifyResult> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error("MISTRAL_API_KEY tidak diset");

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "pixtral-12b-2409",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 200,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Mistral HTTP ${res.status}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const parsed = parseVerdict(data.choices?.[0]?.message?.content ?? "");
  if (!parsed) throw new Error("Mistral: respons tidak dapat diparse");
  return { ...parsed, provider: "mistral" };
}

/**
 * Verifikasi foto (jika ada) terhadap judul/deskripsi. Selalu return verdict,
 * tidak pernah throw — kalau semua provider gagal verdict = "unsure".
 * Timeout per provider 15s, total waktu maksimum 3x fallback chain.
 */
export async function verifyReportPhoto(
  photo: File | null,
  title: string,
  description: string,
): Promise<AiVerifyResult> {
  if (!photo || photo.size === 0) {
    return { verdict: "unsure", reason: "Tanpa foto", provider: null };
  }
  if (photo.size > 5 * 1024 * 1024) {
    return { verdict: "unsure", reason: "Foto terlalu besar untuk AI", provider: null };
  }

  const { base64, mime } = await fileToBase64(photo);
  const prompt = buildPrompt(title, description);

  for (const verify of [verifyWithGemini, verifyWithGroq, verifyWithMistral]) {
    try {
      return await verify(base64, mime, prompt);
    } catch {
      // Provider gagal: coba berikutnya.
      continue;
    }
  }

  return {
    verdict: "unsure",
    reason: "Verifikasi otomatis tidak tersedia",
    provider: null,
  };
}
