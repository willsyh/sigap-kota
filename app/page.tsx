import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock,
  Compass,
  FileCheck2,
  Flame,
  Layers,
  MapPin,
  Radio,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Vote,
  WifiOff,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS, STATUS_META } from "@/lib/constants/reports";
import type { Report, ReportCategory, ReportStatus } from "@/lib/types";

export const metadata = {
  title: "SigapKota — Platform Pemetaan & Respons Masalah Fasilitas Kota",
  description:
    "Solusi partisipatif warga untuk infrastruktur dan fasilitas perkotaan. Transparan, terverifikasi, dan real-time.",
};

async function getRecentReports(): Promise<Report[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2);
    return data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const recentReports = await getRecentReports();

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased selection:bg-primary/20 selection:text-primary">
      <Navbar />

      {/* Hero Section */}
      <section className="relative border-b border-outline-variant/30 bg-surface-lowest px-4 pb-20 pt-14 md:pb-28 md:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            
            {/* Left Content */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-xs font-semibold text-primary">
                <Radio className="h-3.5 w-3.5 animate-pulse text-secondary" />
                Sistem Intelijen Fasilitas Publik Nasional
              </div>

              <h1 className="font-heading text-4xl font-extrabold tracking-tight text-on-surface sm:text-6xl sm:leading-[1.12]">
                Masalah infrastruktur kota, kini terpantau <span className="underline decoration-secondary decoration-wavy decoration-2 underline-offset-8">tanpa celah</span>.
              </h1>

              <p className="max-w-xl text-base text-on-surface-variant md:text-lg leading-relaxed">
                SigapKota mengubah keluhan warga menjadi data geospasial presisi. 
                Tiap titik didukung validasi komunitas, direspons petugas, dan diawasi hingga tuntas dengan bukti nyata.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center pt-2">
                <Link
                  href="/peta"
                  className={buttonVariants({
                    size: "lg",
                    className: "h-12 rounded-xl px-7 font-heading text-base font-bold shadow-sm",
                  })}
                >
                  Buka Radar Peta Live
                  <ArrowUpRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/laporan/baru"
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className: "h-12 rounded-xl px-6 font-heading text-base font-bold border-outline-variant/60 hover:bg-surface-container",
                  })}
                >
                  Kirim Laporan Warga
                </Link>
              </div>

              {/* Status Ribbon */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-medium text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-tertiary" />
                  <span>100% Open & Transparan</span>
                </div>
                <div className="flex items-center gap-2">
                  <WifiOff className="h-4 w-4 text-amber-600" />
                  <span>Didukung Mode Offline Lapangan</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Anti-Spam Multi-Layer</span>
                </div>
              </div>
            </div>

            {/* Right Live Real Data Cards */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-outline-variant/40 bg-surface-low p-5 shadow-xl shadow-primary/5">
                <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-error" />
                    <span className="h-3 w-3 rounded-full bg-secondary" />
                    <span className="h-3 w-3 rounded-full bg-tertiary" />
                  </div>
                  <span className="text-[11px] font-semibold text-outline">Aktivitas Laporan Terkini</span>
                </div>

                <div className="mt-4 space-y-3">
                  {recentReports.length > 0 ? (
                    recentReports.map((report) => (
                      <Link
                        key={report.id}
                        href={`/laporan/${report.id}`}
                        className="block rounded-2xl border border-outline-variant/30 bg-surface-lowest p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant={STATUS_META[report.status as ReportStatus]?.badgeVariant ?? "outline"}
                            className="text-[11px] px-2 py-0.5"
                          >
                            {CATEGORY_LABELS[report.category as ReportCategory] ?? report.category}
                          </Badge>
                          <span className="flex items-center gap-1 text-[11px] text-outline">
                            <Clock className="h-3 w-3" />
                            {new Date(report.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-bold text-on-surface line-clamp-1">{report.title}</p>
                        {report.description && (
                          <p className="mt-1 text-xs text-outline line-clamp-1">{report.description}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-outline-variant/20">
                          <span className="flex items-center gap-1 text-outline text-[11px]">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-secondary text-[11px]">
                            <ThumbsUp className="h-3 w-3" /> {report.vote_count ?? 0} Dukungan
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-lowest p-6 text-center text-xs text-outline">
                      Belum ada laporan terbaru di database.
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-xl bg-surface-lowest/80 p-3 text-center">
                  <Link href="/laporan" className="inline-flex items-center text-xs font-bold text-primary hover:underline">
                    Lihat Semua Aktivitas Penanganan Kota <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Triad of Core Architecture */}
      <section className="border-b border-outline-variant/20 bg-surface-low/50 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-secondary">
              Pilar Solusi
            </h2>
            <p className="mt-2 font-heading text-2xl font-bold text-on-surface sm:text-3xl">
              Tiga langkah memutus rantai birokrasi aduan publik
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/35 bg-surface-lowest p-7 transition-all hover:border-primary/50 hover:shadow-md">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-on-surface">1. Geotagging & Offline Outbox</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Laporan dipasangkan dengan koordinat presisi. Tanpa sinyal di lokasi kejadian? Form tetap tersimpan di memori perangkat dan dikirim otomatis saat online.
                </p>
              </div>
              <div className="mt-6 border-t border-outline-variant/20 pt-4 text-xs font-semibold text-primary">
                GPS Hardware + IndexedDB Storage
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/35 bg-surface-lowest p-7 transition-all hover:border-secondary/50 hover:shadow-md">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <Vote className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-on-surface">2. Validasi Komunitas Warga</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Sistem satu-akun satu-vote menyaring laporan prioritas. Warga sekitar dapat saling menguatkan urgensi titik masalah tanpa menduplikasi data aduan.
                </p>
              </div>
              <div className="mt-6 border-t border-outline-variant/20 pt-4 text-xs font-semibold text-secondary">
                Atomic Increment DB Constraint
              </div>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/35 bg-surface-lowest p-7 transition-all hover:border-tertiary/50 hover:shadow-md">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary">
                  <FileCheck2 className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-on-surface">3. Eksekusi & Audit Terbuka</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Petugas memperbarui tahapan penanganan dengan foto bukti sebelum & sesudah. Pelapor asli memverifikasi kepuasan penyelesaian sebelum status ditutup.
                </p>
              </div>
              <div className="mt-6 border-t border-outline-variant/20 pt-4 text-xs font-semibold text-tertiary">
                Before/After Visual Proofing
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep-Dive Grid */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="font-heading text-2xl font-bold text-on-surface sm:text-4xl">
              Kecerdasan Spasial untuk Tata Ruang
            </h2>
            <p className="text-sm text-on-surface-variant">
              Bukan sekadar buku tamu aduan, melainkan sistem analitik terintegrasi untuk perbaikan kota berkelanjutan.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-outline-variant/35 bg-surface-lowest p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                <Flame className="h-5 w-5" />
              </div>
              <h4 className="font-heading font-bold text-on-surface">Heatmap</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Mendeteksi kluster akumulasi kerusakan secara visual, memudahkan dinas terkait mengalokasikan anggaran perbaikan ke area terparah.
              </p>
            </div>

            <div className="rounded-2xl border border-outline-variant/35 bg-surface-lowest p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="font-heading font-bold text-on-surface">Lapisan Persepsi (Pulse)</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Merekam rasa aman, tingkat penerangan, dan kenyamanan pejalan kaki di setiap sudut kota untuk audit tata kota yang inklusif.
              </p>
            </div>

            <div className="rounded-2xl border border-outline-variant/35 bg-surface-lowest p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <h4 className="font-heading font-bold text-on-surface">Verifikasi Vision AI</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Model vision otomatis mencocokkan kesesuaian gambar foto dengan deskripsi teks aduan, memangkas beban moderasi spam admin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Banner */}
      <footer className="border-t border-outline-variant/30 bg-surface-lowest px-4 py-14">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <span className="font-heading text-lg font-bold text-primary">SigapKota</span>
            <p className="text-xs text-outline mt-1">Platform Pemetaan Masalah Fasilitas Umum & Respons Cepat Komunitas.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-on-surface-variant">
            <Link href="/peta" className="hover:text-primary transition-colors">Radar Peta</Link>
            <Link href="/laporan" className="hover:text-primary transition-colors">Daftar Laporan</Link>
            <Link href="/panduan" className="hover:text-primary transition-colors">Panduan Warga</Link>
            <Link href="/auth/login" className="hover:text-primary transition-colors">Masuk Akun</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
