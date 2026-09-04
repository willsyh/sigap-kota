import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  History,
  Info,
  Layers,
  MessageSquareHeart,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Panduan Administrator | SigapKota Admin",
  description: "Dokumentasi operasional lengkap dan SOP pengelolaan laporan untuk administrator SigapKota.",
};

const coreFeatures = [
  {
    icon: FileText,
    title: "1. Manajemen & Pembaruan Status Laporan",
    description: "Alur verifikasi, validasi bukti foto penanganan, pembaruan status 3-tahap, dan penghapusan laporan.",
    points: [
      "Ubah status dari Dilaporkan -> Diproses -> Selesai.",
      "Unggah bukti foto penanganan (Foto After) saat menandai selesai untuk transparansi publik.",
      "Filter laporan berdasarkan status, kategori, atau pencarian teks kata kunci lokasi/judul.",
      "Tindakan penghapusan laporan wajib menyertakan alasan untuk audit trail.",
    ],
  },
  {
    icon: MessageSquareHeart,
    title: "2. Persepsi Warga (AI Sentimen & Analisis)",
    description: "Monitoring sentimen publik berbasis AI untuk mendeteksi urgensi isu di tiap wilayah.",
    points: [
      "Analisis ringkasan otomatis (AI Insight) terhadap konsentrasi keluhan warga.",
      "Distribusi persepsi warga (Positif, Netral, Kritis/Urgen) secara real-time.",
      "Rekomendasi tindakan responsif untuk dinas teknis terkait.",
    ],
  },
  {
    icon: History,
    title: "3. Log Aktivitas & Audit Trail",
    description: "Pencatatan rekam jejak digital seluruh tindakan operasional sistem.",
    points: [
      "Mencatat setiap pergantian status dan siapa petugas yang memproses.",
      "Log penghapusan laporan (Deletion Audit) tersimpan lengkap beserta alasan.",
      "Dapat difilter dan ditinjau sewaktu-waktu untuk kepatuhan akuntabilitas publik.",
    ],
  },
  {
    icon: FileSpreadsheet,
    title: "4. Ekspor Data & Pelaporan",
    description: "Pengunduhan rekapitulasi data laporan untuk koordinasi lintas dinas.",
    points: [
      "Ekspor laporan ke format CSV / data terstruktur.",
      "Dapat disaring berdasarkan rentang tanggal dan kategori masalah.",
    ],
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Verifikasi Masalah (Dilaporkan)",
    desc: "Cek keaslian foto, kejelasan koordinat peta, dan relevansi kategori (Jalan Rusak, Sampah, Banjir, Fasilitas Umum). Pastikan bukan spam.",
    badge: "Status: Dilaporkan",
  },
  {
    step: "02",
    title: "Disposisi & Penanganan (Diproses)",
    desc: "Ubah status ke 'Diproses'. Tim lapangan/dinas terkait diterjunkan ke lokasi untuk perbaikan atau pembersihan.",
    badge: "Status: Diproses",
  },
  {
    step: "03",
    title: "Unggah Foto Bukti & Tutup (Selesai)",
    desc: "Unggah 'Foto After' (bukti setelah perbaikan). Ubah status menjadi 'Selesai'. Warga dapat melihat transparansi Before/After di halaman publik.",
    badge: "Status: Selesai",
  },
];

const adminFaqs = [
  {
    q: "Kapan bukti 'Foto After' harus diunggah?",
    a: "Sangat disarankan diunggah ketika status diubah menjadi 'Selesai'. Fitur slider Before/After di sisi publik akan otomatis aktif menampilkan perbandingan kondisi awal dan akhir.",
  },
  {
    q: "Apakah laporan yang dihapus bisa dikembalikan?",
    a: "Laporan yang dihapus dari database aktif akan masuk ke Log Penghapusan (Deletion Log) untuk audit trail. Selalu pastikan alasan penghapusan diisi dengan jelas.",
  },
  {
    q: "Bagaimana cara kerja Heatmap dan deteksi duplikasi?",
    a: "Sistem otomatis mengelompokkan laporan radius 100m dengan kategori sama sebagai duplikat saat warga melapor. Peta warga menyajikan Heatmap konsentrasi titik masalah.",
  },
  {
    q: "Bagaimana cara beralih kembali ke tampilan warga?",
    a: "Gunakan tombol 'Ke Tampilan Warga' di bilah samping navigasi kiri admin atau melalui link di header ponsel.",
  },
];

export default function AdminPanduanPage() {
  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,109,119,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <ShieldCheck className="h-4 w-4" />
              Standard Operating Procedure (SOP)
            </span>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl text-on-surface">
              Panduan Administrator SigapKota
            </h1>
            <p className="text-sm text-outline leading-relaxed">
              Panduan lengkap operasional petugas dalam memverifikasi, menangani laporan warga, memanfaatkan analisis AI, dan menjaga akuntabilitas pelayanan publik.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/laporan"
              className={cn(buttonVariants({ size: "sm" }), "gap-2 font-medium")}
            >
              <FileText className="h-4 w-4" />
              Kelola Laporan
            </Link>
            <Link
              href="/admin/persepsi"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2 font-medium")}
            >
              <Eye className="h-4 w-4" />
              Persepsi Warga
            </Link>
          </div>
        </div>
      </div>

      {/* Alur SOP */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold">Alur Kerja Penanganan Laporan</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {workflowSteps.map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading text-2xl font-black text-primary/30">
                    {item.step}
                  </span>
                  <span className="rounded-md bg-surface-container px-2 py-1 text-xs font-semibold text-on-surface-variant">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-heading text-base font-bold text-on-surface mb-2">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-outline">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Fitur Utama Admin */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold">Fitur Utama Panel Admin</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {coreFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-heading text-base font-bold text-on-surface">
                      {feat.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-outline leading-relaxed">
                  {feat.description}
                </p>
                <ul className="space-y-1.5 pt-2 border-t border-outline-variant/20">
                  {feat.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-on-surface-variant">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Admin */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold">Tanya Jawab Petugas (FAQ)</h2>
        </div>
        <div className="space-y-3">
          {adminFaqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-xl border border-outline-variant/30 bg-surface-lowest"
            >
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-sm font-semibold text-on-surface">
                {faq.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-outline transition-transform group-open:rotate-180" />
              </summary>
              <p className="border-t border-outline-variant/20 px-5 py-4 text-xs leading-relaxed text-on-surface-variant">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
