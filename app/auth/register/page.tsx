"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import Navbar from "@/components/Navbar";
import AuthForm, { sanitizeNextParam } from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/client";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextParam(searchParams.get("next"));

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) router.replace(nextPath ?? "/");
    });
  }, [router, nextPath]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 items-center justify-center p-4">
        <AuthForm mode="register" nextPath={nextPath ?? undefined} />
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
