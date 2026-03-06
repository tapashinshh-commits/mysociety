// Re-export from new modular client for backward compatibility
export { createSupabaseBrowser } from "./supabase/client";

// Legacy default export — prefer using createSupabaseBrowser() or useUser() hook
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase =
  supabaseUrl && supabaseUrl.startsWith("http")
    ? createBrowserClient(supabaseUrl, supabaseAnonKey)
    : (null as unknown as ReturnType<typeof createBrowserClient>);
