"use client";

import { ArrowLeft } from "lucide-react";

interface AppShellProps {
  title: string;
  children: React.ReactNode;
  /** Right side of navbar */
  actions?: React.ReactNode;
  /** Container max width — "narrow" for max-w-2xl, "wide" for max-w-7xl */
  maxWidth?: "narrow" | "wide";
  /** Show back button linking to dashboard */
  showBack?: boolean;
  loading?: boolean;
}

export default function AppShell({
  title,
  children,
  actions,
  maxWidth = "narrow",
  showBack = true,
  loading = false,
}: AppShellProps) {
  const containerClass =
    maxWidth === "wide" ? "max-w-7xl" : "max-w-2xl";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div
          className={`mx-auto flex ${containerClass} items-center justify-between px-4 py-3`}
        >
          <div className="flex items-center gap-3">
            {showBack && (
              <a
                href="/dashboard"
                className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                <ArrowLeft size={20} />
              </a>
            )}
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </nav>

      <div className={`mx-auto ${containerClass} px-4 py-6`}>{children}</div>
    </div>
  );
}
