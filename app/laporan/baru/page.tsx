import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import CivicBrandMark from "@/components/CivicBrandMark";
import ReportForm from "@/components/reports/ReportForm";

export default function NewReportPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 flex h-16 items-center border-b border-outline-variant/20 bg-surface/96 px-4 shadow-sm backdrop-blur-md">
        <Link href="/laporan" aria-label="Kembali ke daftar laporan" className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="ml-2 font-heading text-2xl font-bold tracking-tight text-on-surface">Laporkan masalah</h1>
        <Link href="/" aria-label="Beranda SigapKota" className="ml-auto flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <CivicBrandMark size="sm" />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[600px] px-4 pb-8 pt-6">
        <ReportForm />
      </main>
    </div>
  );
}
