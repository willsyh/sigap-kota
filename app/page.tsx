import { Database, Layers3, MapPinned } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const foundations = [
  {
    title: "App Router dan TypeScript",
    description: "Fondasi Next.js, Tailwind CSS, dan shadcn/ui sudah aktif.",
    icon: Layers3,
  },
  {
    title: "Supabase dan React Query",
    description: "Helper client/server dan provider data sudah tersedia.",
    icon: Database,
  },
  {
    title: "Leaflet dan OpenStreetMap",
    description: "Dependency, stylesheet, dan konfigurasi tile dasar sudah siap.",
    icon: MapPinned,
  },
] as const;

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-16">
      <Card className="w-full max-w-2xl">
        <CardHeader className="gap-4">
          <Badge variant="secondary" className="w-fit">
            Fondasi project aktif
          </Badge>
          <div className="space-y-2">
            <CardTitle className="text-3xl tracking-tight sm:text-4xl">
              SigapKota
            </CardTitle>
            <CardDescription className="text-base leading-7">
              Project berhasil diinisialisasi. Konfigurasi utama untuk fondasi
              MVP sudah tersedia dan siap dikembangkan pada tahap berikutnya.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-3">
            {foundations.map(({ title, description, icon: Icon }) => (
              <li key={title} className="rounded-lg border bg-background p-4">
                <Icon className="mb-3 size-5 text-primary" aria-hidden="true" />
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
