"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import AuthForm, { sanitizeNextParam } from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/client";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextParam(searchParams.get("next"));

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) router.replace(nextPath ?? "/");
    });
  }, [router, nextPath]);

  return (
    <div className="civic-map-pattern flex min-h-screen flex-col bg-surface">
      <main className="flex flex-1 items-center justify-center p-4 py-10">
        <AuthForm mode="login" nextPath={nextPath ?? undefined} />
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="civic-map-pattern flex min-h-screen items-center justify-center bg-surface">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
