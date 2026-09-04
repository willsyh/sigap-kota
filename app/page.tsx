import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Compass,
  FileCheck2,
  Flame,
  Layers,
  MapPin,
  Percent,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Vote,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "SigapKota — Platform Pemetaan & Respons Masalah Fasilitas Kota",
  description:
    "Solusi partisipatif warga untuk infrastruktur dan fasilitas perkotaan. Transparan, terverifikasi, dan real-time.",
};

export const revalidate = 60;

interface HomeStats {
  totalReports: number;
  resolvedReports: number;
  totalVotes: number;
  completionRate: number | null;
}

async function getStats(): Promise<HomeStats | null> {
  try {
    const supabase = await createClient();

    const { count: totalReports } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true });

    const { count: resolvedReports } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "selesai");

    const { data: voteRows } = await supabase
      .from("reports")
      .select("vote_count");

    const total = totalReports ?? 0;
    const resolved = resolvedReports ?? 0;
    const totalVotes =
      voteRows?.reduce((sum, row) => sum + (row.vote_count ?? 0), 0) ?? 0;

    return {
      totalReports: total,
      resolvedReports: resolved,
      totalVotes,
      completionRate: total > 0 ? Math.round((resolved / total) * 100) : null,
    };
  } catch {
    return null;
  }
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("id-ID").format(value);
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased selection:bg-primary/20 selection:text-primary">
      <Navbar />

      {/* Hero: split 12-col grid, left copy + right modular mosaic */}
      <section className="bg-surface-lowest px-4 pb-20 pt-14 md:pb-28 md:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left content */}
            <div className="space-y-6 lg:col-span-7">
              <p className="text-xs font-bold uppercase tracking-[0.05em] text-primary">
                Platform Tata Kota &amp; Respons Publik
              </p>

              <h1 className="font-heading text-4xl font-extrabold tracking-tight text-on-surface sm:text-6xl sm:leading-[1.12]">
                Masalah infrastruktur kota, kini terpantau{" "}
                <span className="text-primary">tanpa celah</span>.
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-on-surface-variant md:text-lg">
                SigapKota mengubah laporan warga menjadi data geospasial presisi.
                Setiap titik terverifikasi komunitas, direspons petugas, dan
                diawasi hingga tuntas dengan bukti nyata.
              </p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                <Link
                  href="/peta"
                  className={buttonVariants({
                    size: "lg",
                    className: "h-12 rounded-xl px-7 font-heading text-base font-bold",
                  })}
                >
                  Buka Radar Peta
                  <ArrowUpRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/laporan/baru"
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className: "h-12 rounded-xl border-outline-variant/60 px-6 font-heading text-base font-bold hover:bg-surface-container",
                  })}
                >
                  Kirim Laporan
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-xs font-medium text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-tertiary" />
                  <span>Transparan &amp; terbuka</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Terverifikasi komunitas</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-secondary" />
                  <span>Peta real-time</span>
                </div>
              </div>
            </div>

            {/* Right: modular geometric mosaic (3x3 desktop, 2x2 mobile) */}
            <div className="lg:col-span-5">
              <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-3 lg:max-w-none lg:grid-cols-3">
                <div className="flex aspect-square flex-col justify-between rounded-2xl bg-primary p-4 text-primary-foreground">
                  <MapPin className="h-5 w-5" />
                  <p className="text-xs font-semibold leading-snug">
                    Laporan terpetakan
                  </p>
                </div>

                <div className="civic-map-pattern flex aspect-square items-center justify-center rounded-2xl border border-outline-variant/40">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <MapPin className="h-4 w-4" />
                  </span>
                </div>

                <div aria-hidden="true" className="hidden lg:block" />
                <div aria-hidden="true" className="hidden lg:block" />

                <div className="flex aspect-square flex-col justify-between rounded-2xl border border-outline-variant/40 bg-surface-low p-4">
                  <ThumbsUp className="h-5 w-5 text-primary" />
                  <p className="text-xs font-semibold leading-snug text-on-surface">
                    Dukungan warga
                  </p>
                </div>

                <div aria-hidden="true" className="hidden lg:block" />
                <div aria-hidden="true" className="hidden lg:block" />
                <div aria-hidden="true" className="hidden lg:block" />

                <div className="flex aspect-square flex-col justify-between rounded-2xl bg-tertiary-container p-4 text-on-tertiary-container">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-xs font-semibold leading-snug">
                    Selesai ditangani
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metric strip: live stats with graceful fallback */}
      <section className="border-y border-outline-variant/30 bg-surface px-4 py-6 md:py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <dl className="grid w-full grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
                  Total Laporan
                </dt>
                <dd className="font-heading text-2xl font-bold tabular-nums text-on-surface">
                  {formatNumber(stats?.totalReports)}
                </dd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
                  Selesai Ditangani
                </dt>
                <dd className="font-heading text-2xl font-bold tabular-nums text-on-surface">
                  {formatNumber(stats?.resolvedReports)}
                </dd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary">
                <ThumbsUp className="h-5 w-5" />
              </span>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
                  Dukungan Warga
                </dt>
                <dd className="font-heading text-2xl font-bold tabular-nums text-on-surface">
                  {formatNumber(stats?.totalVotes)}
                </dd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Percent className="h-5 w-5" />
              </span>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.05em] text-outline">
                  Tingkat Penyelesaian
                </dt>
                <dd className="font-heading text-2xl font-bold tabular-nums text-on-surface">
                  {stats?.completionRate != null
                    ? `${formatNumber(stats.completionRate)}%`
                    : "—"}
                </dd>
              </div>
            </div>
          </dl>

          <Link
            href="/peta"
            className="inline-flex shrink-0 items-center gap-1.5 font-heading text-sm font-semibold text-primary transition-colors hover:underline"
          >
            Eksplorasi Radar Peta
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Pilar Solusi: institutional copy, no jargon */}
      <section className="border-b border-outline-variant/20 bg-surface-low/50 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="font-heading text-xs font-bold uppercase tracking-[0.05em] text-secondary">
              Pilar Solusi
            </h2>
            <p className="mt-2 font-heading text-2xl font-bold text-on-surface sm:text-3xl">
              Tiga langkah memutus rantai birokrasi aduan publik
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/35 bg-surface-lowest p-7 transition-all hover:border-primary/50 hover:shadow-[0_2px_12px_rgba(0,109,119,0.05)]">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-on-surface">
                  Pemetaan Geospasial Presisi
                </h3>
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  Setiap laporan dipasangkan dengan koordinat presisi di peta
                  interaktif. Dinas terkait melihat lokasi, kategori, dan tingkat
                  dukungan warga untuk memprioritaskan respons.
                </p>
              </div>
              <div className="mt-6 border-t border-outline-variant/20 pt-4 text-xs font-semibold text-primary">
                Koordinat akurat untuk respons dinas
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/35 bg-surface-lowest p-7 transition-all hover:border-primary/50 hover:shadow-[0_2px_12px_rgba(0,109,119,0.05)]">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <Vote className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-on-surface">
                  Validasi Komunitas Terbuka
                </h3>
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  Sistem satu akun satu dukungan menyaring laporan prioritas.
                  Warga sekitar saling menguatkan urgensi titik masalah tanpa
                  menduplikasi data aduan.
                </p>
              </div>
              <div className="mt-6 border-t border-outline-variant/20 pt-4 text-xs font-semibold text-primary">
                Satu akun, satu dukungan
              </div>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/35 bg-surface-lowest p-7 transition-all hover:border-primary/50 hover:shadow-[0_2px_12px_rgba(0,109,119,0.05)]">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary">
                  <FileCheck2 className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-on-surface">
                  Akuntabilitas Sebelum &amp; Sesudah
                </h3>
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  Petugas memperbarui tahapan penanganan dengan foto bukti sebelum
                  dan sesudah. Setiap perubahan status tercatat dan dapat diawasi
                  publik hingga tuntas.
                </p>
              </div>
              <div className="mt-6 border-t border-outline-variant/20 pt-4 text-xs font-semibold text-primary">
                Bukti foto penanganan
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur Unggulan */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl space-y-16">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <h2 className="font-heading text-2xl font-bold text-on-surface sm:text-4xl">
              Kecerdasan Spasial untuk Tata Ruang
            </h2>
            <p className="text-sm text-on-surface-variant">
              Bukan sekadar buku tamu aduan, melainkan sistem analitik
              terintegrasi untuk perbaikan kota berkelanjutan.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3 rounded-2xl border border-outline-variant/35 bg-surface-lowest p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Flame className="h-5 w-5" />
              </div>
              <h4 className="font-heading font-bold text-on-surface">Heatmap</h4>
              <p className="text-xs leading-relaxed text-on-surface-variant">
                Mendeteksi kluster akumulasi kerusakan secara visual, memudahkan
                dinas terkait mengalokasikan anggaran perbaikan ke area terparah.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-outline-variant/35 bg-surface-lowest p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary/10 text-tertiary">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="font-heading font-bold text-on-surface">
                Lapisan Persepsi
              </h4>
              <p className="text-xs leading-relaxed text-on-surface-variant">
                Merekam rasa aman, tingkat penerangan, dan kenyamanan pejalan kaki
                di setiap sudut kota untuk audit tata kota yang inklusif.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-outline-variant/35 bg-surface-lowest p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h4 className="font-heading font-bold text-on-surface">
                Verifikasi Vision AI
              </h4>
              <p className="text-xs leading-relaxed text-on-surface-variant">
                Model vision otomatis mencocokkan kesesuaian gambar foto dengan
                deskripsi teks aduan, memangkas beban moderasi spam admin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant/30 bg-surface-lowest px-4 py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <span className="font-heading text-lg font-bold text-primary">
              SigapKota
            </span>
            <p className="mt-1 text-xs text-outline">
              Platform Pemetaan Masalah Fasilitas Umum &amp; Respons Cepat
              Komunitas.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-on-surface-variant">
            <Link href="/peta" className="transition-colors hover:text-primary">
              Radar Peta
            </Link>
            <Link href="/laporan" className="transition-colors hover:text-primary">
              Daftar Laporan
            </Link>
            <Link href="/panduan" className="transition-colors hover:text-primary">
              Panduan Warga
            </Link>
            <Link href="/auth/login" className="transition-colors hover:text-primary">
              Masuk Akun
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}