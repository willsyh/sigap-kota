import type { Metadata } from "next";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  FileSearch,
  ListFilter,
  LocateFixed,
  LogIn,
  MapPinned,
  ThumbsUp,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Panduan Penggunaan | SigapKota",
  description: "Panduan singkat untuk melihat, membuat, dan memantau laporan di SigapKota.",
};

const guideSteps = [
  {
    icon: MapPinned,
    title: "Lihat kondisi kota",
    description:
      "Buka Beranda untuk melihat titik laporan pada peta, atau buka Aktivitas untuk melihat semuanya sebagai daftar.",
  },
  {
    icon: LogIn,
    title: "Masuk atau buat akun",
    description:
      "Anda dapat melihat laporan tanpa akun. Masuk diperlukan saat ingin mengirim atau mendukung laporan.",
  },
  {
    icon: CirclePlus,
    title: "Pilih menu Lapor",
    description:
      "Tambahkan foto bila ada, pilih kategori masalah, lalu tulis judul dan keterangan yang mudah dipahami.",
  },
  {
    icon: LocateFixed,
    title: "Pastikan lokasi tepat",
    description:
      "Izinkan akses lokasi agar posisi terdeteksi otomatis. Anda juga dapat menggeser penanda pada peta secara manual.",
  },
  {
    icon: FileSearch,
    title: "Periksa laporan serupa",
    description:
      "Jika masalah yang sama sudah dilaporkan di sekitar lokasi, Anda dapat mendukung laporan tersebut atau tetap membuat laporan baru.",
  },
  {
    icon: ThumbsUp,
    title: "Pantau dan beri dukungan",
    description:
      "Buka detail laporan untuk melihat perkembangannya. Dukungan membantu menunjukkan masalah yang perlu diprioritaskan.",
  },
];

const statuses = [
  { label: "Dilaporkan", description: "Laporan sudah diterima dan menunggu tindak lanjut." },
  { label: "Diproses", description: "Masalah sedang dalam proses penanganan." },
  { label: "Menunggu Konfirmasi", description: "Hasil penanganan menunggu konfirmasi penyelesaian." },
  { label: "Selesai", description: "Laporan sudah ditangani dan dinyatakan selesai." },
];

const faqs = [
  {
    question: "Apakah saya harus memiliki akun?",
    answer:
      "Tidak untuk melihat peta dan daftar laporan. Akun diperlukan untuk mengirim laporan dan memberikan dukungan.",
  },
  {
    question: "Bagaimana jika lokasi saya tidak terdeteksi?",
    answer:
      "Periksa izin lokasi pada browser, lalu tekan Gunakan lokasi saya. Jika masih gagal, geser penanda pada peta ke lokasi masalah.",
  },
  {
    question: "Apakah foto wajib disertakan?",
    answer:
      "Foto tidak wajib, tetapi sangat disarankan karena membantu menjelaskan kondisi masalah kepada petugas.",
  },
  {
    question: "Apa yang harus dilakukan jika ada laporan serupa?",
    answer:
      "Pilih Dukung pada laporan yang sudah ada agar laporan tidak terduplikasi. Anda tetap dapat melanjutkan laporan baru jika masalahnya berbeda.",
  },
];

export default function PanduanPage() {
  return (
    <div className="min-h-screen bg-surface pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="overflow-hidden rounded-3xl border border-outline-variant/35 bg-surface-lowest px-5 py-8 shadow-[0_8px_32px_rgba(0,83,91,0.08)] sm:px-10 sm:py-12">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Panduan untuk warga
            </span>
            <h1 className="mt-5 font-heading text-3xl font-bold tracking-[-0.035em] text-on-surface sm:text-4xl">
              Mudah melapor, mudah memantau
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base">
              Ikuti langkah berikut untuk menggunakan SigapKota. Anda dapat mulai dengan melihat laporan warga lain tanpa perlu masuk.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/laporan/baru" className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-xl px-5 font-semibold")}>
                <CirclePlus className="h-5 w-5" aria-hidden="true" />
                Buat laporan
              </Link>
              <Link href="/laporan" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 rounded-xl px-5 font-semibold")}>
                <ListFilter className="h-5 w-5" aria-hidden="true" />
                Lihat daftar laporan
              </Link>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14" aria-labelledby="langkah-panduan">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Langkah penggunaan</p>
            <h2 id="langkah-panduan" className="mt-2 font-heading text-2xl font-bold text-on-surface">
              Dari melihat hingga memantau laporan
            </h2>
          </div>

          <ol className="grid gap-4 md:grid-cols-2">
            {guideSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="flex gap-4 rounded-2xl border border-outline-variant/35 bg-surface-lowest p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">LANGKAH {index + 1}</p>
                    <h3 className="mt-1 font-heading text-base font-bold text-on-surface">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-on-surface-variant">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="rounded-2xl border border-outline-variant/35 bg-surface-lowest p-5 sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container/25 text-secondary">
              <Camera className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-heading text-xl font-bold text-on-surface">Agar laporan mudah ditindaklanjuti</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-on-surface-variant">
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-tertiary" aria-hidden="true" />Gunakan judul yang spesifik, misalnya lokasi dan jenis masalah.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-tertiary" aria-hidden="true" />Tambahkan foto yang jelas dan tidak memuat data pribadi.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-tertiary" aria-hidden="true" />Pastikan penanda peta berada sedekat mungkin dengan lokasi kejadian.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-outline-variant/35 bg-surface-lowest p-5 sm:p-6">
            <h2 className="font-heading text-xl font-bold text-on-surface">Arti status laporan</h2>
            <ol className="mt-5 space-y-4">
              {statuses.map((status, index) => (
                <li key={status.label} className="relative flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface">{status.label}</h3>
                    <p className="mt-0.5 text-sm leading-6 text-on-surface-variant">{status.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-10 sm:py-14" aria-labelledby="pertanyaan-umum">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Bantuan cepat</p>
          <h2 id="pertanyaan-umum" className="mt-2 font-heading text-2xl font-bold text-on-surface">Pertanyaan umum</h2>
          <div className="mt-5 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-xl border border-outline-variant/35 bg-surface-lowest">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                  {faq.question}
                  <ChevronDown className="h-5 w-5 shrink-0 text-outline transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="border-t border-outline-variant/30 px-4 py-4 text-sm leading-6 text-on-surface-variant">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
