import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import Navbar from "@/components/Navbar";
import ReportForm from "@/components/reports/ReportForm";

export default function NewReportPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="container flex-1 px-4 py-6 space-y-4">
        <Link
          href="/laporan"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Buat Laporan Baru</h1>
          <p className="text-sm text-muted-foreground">
            Laporkan masalah fasilitas umum di sekitarmu agar segera ditangani.
          </p>
        </div>

        <ReportForm />
      </main>
    </div>
  );
}
