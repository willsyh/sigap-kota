"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthError } from "@supabase/supabase-js";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";

import CivicBrandMark from "@/components/CivicBrandMark";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "register";
  nextPath?: string;
}

const GENERIC_AUTH_ERROR = "Terjadi kesalahan. Coba lagi sebentar.";

function mapAuthErrorMessage(error: unknown): string {
  if (!(error instanceof AuthError)) return GENERIC_AUTH_ERROR;
  switch (error.code) {
    case "invalid_credentials": return "Email atau kata sandi salah.";
    case "email_not_confirmed": return "Email belum dikonfirmasi. Cek kotak masuk Anda.";
    case "user_already_exists": return "Email sudah terdaftar. Silakan masuk.";
    case "weak_password": return "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit": return "Terlalu banyak percobaan. Coba lagi nanti.";
  }
  const message = error.message.toLowerCase();
  if (message.includes("invalid login credentials")) return "Email atau kata sandi salah.";
  if (message.includes("email not confirmed")) return "Email belum dikonfirmasi. Cek kotak masuk Anda.";
  if (message.includes("already registered") || message.includes("already exists")) return "Email sudah terdaftar. Silakan masuk.";
  if (message.includes("rate limit")) return "Terlalu banyak percobaan. Coba lagi nanti.";
  return GENERIC_AUTH_ERROR;
}

export function sanitizeNextParam(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("://") || value.includes("\\")) return null;
  return value;
}

export default function AuthForm({ mode, nextPath }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = createClient();
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) { setError(mapAuthErrorMessage(authError)); return; }
        router.replace(nextPath ?? "/");
        router.refresh();
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) { setError(mapAuthErrorMessage(authError)); return; }
        if (!data.session) {
          setInfo("Pendaftaran berhasil. Periksa email untuk melakukan verifikasi.");
          return;
        }
        router.replace(nextPath ?? "/");
        router.refresh();
      }
    } catch (authError) {
      setError(mapAuthErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  }

  const alternateHref = nextPath
    ? `/auth/${isLogin ? "register" : "login"}?next=${encodeURIComponent(nextPath)}`
    : `/auth/${isLogin ? "register" : "login"}`;

  return (
    <div className="w-full max-w-md rounded-2xl border border-outline-variant/35 bg-surface-lowest p-6 shadow-[0_8px_32px_rgba(0,83,91,0.08)] sm:p-8">
      <div className="mb-7 text-center">
        <CivicBrandMark className="mx-auto mb-4" />
        <p className="mb-5 text-xs font-bold tracking-[-0.02em] text-primary">SigapKota</p>
        <h1 className="font-heading text-2xl font-semibold text-on-surface">
          {isLogin ? "Masuk ke akun Anda" : "Buat akun SigapKota"}
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {isLogin ? "Akses platform layanan publik kota" : "Mulai laporkan dan pantau masalah kota"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-medium text-on-surface">Alamat email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="warga@kotaku.go.id"
              required
              autoComplete="email"
              className="h-12 w-full rounded-lg border border-outline-variant bg-surface-lowest pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-medium text-on-surface">Kata sandi</label>
            {isLogin && (
              <button type="button" onClick={() => toast.info("Fitur pemulihan kata sandi akan segera tersedia.")} className="cursor-pointer text-xs font-medium text-primary hover:underline">
                Lupa kata sandi?
              </button>
            )}
          </div>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="h-12 w-full rounded-lg border border-outline-variant bg-surface-lowest pl-10 pr-12 text-sm outline-none transition-colors placeholder:text-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              aria-pressed={showPassword}
              title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-outline transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>
        </div>

        {error && <p className="rounded-lg bg-error-container px-3 py-2 text-xs text-on-error-container" role="alert">{error}</p>}
        {info && <p className="rounded-lg bg-tertiary/10 px-3 py-2 text-xs text-tertiary" role="status">{info}</p>}

        <Button type="submit" className="h-12 w-full rounded-lg font-semibold" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLogin ? "Masuk" : "Daftar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-on-surface-variant">
        {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
        <Link href={alternateHref} className="font-semibold text-primary hover:underline">{isLogin ? "Daftar" : "Masuk"}</Link>
      </p>

      <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-outline-variant/50" /><span className="text-xs text-outline">ATAU</span><span className="h-px flex-1 bg-outline-variant/50" /></div>
      <Link href="/" className="flex h-12 w-full items-center justify-center rounded-lg border border-primary font-semibold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Lanjut sebagai tamu
      </Link>
    </div>
  );
}
