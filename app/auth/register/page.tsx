"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/");
    });
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 items-center justify-center p-4">
        <AuthForm mode="register" />
      </main>
    </div>
  );
}
