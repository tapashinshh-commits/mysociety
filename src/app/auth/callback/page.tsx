"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  useEffect(() => {
    if (!supabase) {
      window.location.href = "/auth";
      return;
    }

    // Supabase JS client automatically detects the hash fragment
    // (#access_token=...) and sets the session
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        window.location.href = "/dashboard";
      }
    });

    // Fallback: if already signed in or hash was already processed
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = "/dashboard";
      } else {
        // Wait a moment for hash processing, then redirect
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 3000);
      }
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted">Signing you in...</p>
      </div>
    </div>
  );
}
