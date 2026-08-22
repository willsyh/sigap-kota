"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthError } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "register";
  /** Jalur tujuan setelah autentikasi berhasil. Harus sudah disanitasi oleh pemanggil. */
  nextPath?: string;
}

const GENERIC_AUTH_ERROR = "Terjadi kesalahan. Coba lagi sebentar.";

/**
 * Memetakan error Supabase Auth ke pesan Indonesia.
 * Error non-Supabase (mis. kegagalan jaringan) memakai pesan generik.
 */
function mapAuthErrorMessage(error: unknown): string {
  if (!(error instanceof AuthError)) {
    return GENERIC_AUTH_ERROR;
  }

  switch (error.code) {
    case "invalid_credentials":
      return "Email atau kata sandi salah.";
    case "email_not_confirmed":
      return "Email belum dikonfirmasi. Cek kotak masuk Anda.";
    case "user_already_exists":
      return "Email sudah terdaftar. Silakan masuk.";
    case "weak_password":
      return "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Terlalu banyak percobaan. Coba lagi nanti.";
  }

  // Fallback berbasis pesan untuk error tanpa kode (mis. instance lama).
  const message = error.message.toLowerCase();
  if (message.includes("invalid login credentials")) {
    return "Email atau kata sandi salah.";
  }
  if (message.includes("email not confirmed")) {
    return "Email belum dikonfirmasi. Cek kotak masuk Anda.";
  }
  if (message.includes("already registered") || message.includes("already exists")) {
    return "Email sudah terdaftar. Silakan masuk.";
  }
  if (message.includes("rate limit")) {
    return "Terlalu banyak percobaan. Coba lagi nanti.";
  }

  return GENERIC_AUTH_ERROR;
}

/** Hanya izinkan jalur internal relatif untuk mencegah open redirect. */
export function sanitizeNextParam(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.includes("://")) return null;
  if (value.includes("\\")) return null;
  return value;
}

export default function AuthForm({ mode, nextPath }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(mapAuthErrorMessage(authError));
          return;
        }

        router.replace(nextPath ?? "/");
        router.refresh();
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) {
          setError(mapAuthErrorMessage(authError));
          return;
        }

        // Jika konfirmasi email aktif di Supabase, sesi belum ada.
        if (!data.session) {
          setInfo(
            "Pendaftaran berhasil! Silakan cek email kamu untuk verifikasi sebelum login.",
          );
          return;
        }

        router.replace(nextPath ?? "/");
        router.refresh();
      }
    } catch (err) {
      setError(mapAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">
          {isLogin ? "Masuk" : "Daftar"}
        </CardTitle>
        <CardDescription>
          {isLogin
            ? "Masuk untuk melaporkan dan mendukung laporan warga."
            : "Buat akun baru untuk mulai melaporkan masalah kota."}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="text-xs text-muted-foreground" role="status">
              {info}
            </p>
          )}
        </CardContent>

        <CardFooter className="mt-4 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLogin ? "Masuk" : "Daftar"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {isLogin ? (
              <>
                Belum punya akun?{" "}
                <Link
                  href={
                    nextPath
                      ? `/auth/register?next=${encodeURIComponent(nextPath)}`
                      : "/auth/register"
                  }
                  className="text-primary hover:underline"
                >
                  Daftar
                </Link>
              </>
            ) : (
              <>
                Sudah punya akun?{" "}
                <Link
                  href={
                    nextPath
                      ? `/auth/login?next=${encodeURIComponent(nextPath)}`
                      : "/auth/login"
                  }
                  className="text-primary hover:underline"
                >
                  Masuk
                </Link>
              </>
            )}
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
