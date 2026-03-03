"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthListener() {
  useEffect(() => {
    if (!supabase) return;

    // If URL has #access_token (Supabase implicit flow redirect),
    // the Supabase client auto-detects it and sets the session.
    // We just need to redirect to dashboard after.
    if (window.location.hash.includes("access_token")) {
      supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN") {
          window.location.href = "/dashboard";
        }
      });
    }
  }, []);

  return null;
}
