"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import {
  LogOut,
  MessageCircle,
  Truck,
  ClipboardList,
  Calendar,
  AlertTriangle,
  Users,
  Bell,
  UserCircle,
  Mail,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const { user, profile, loading, supabase } = useUser();

  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [openTickets, setOpenTickets] = useState<number | null>(null);
  const [recentEvents, setRecentEvents] = useState<number | null>(null);

  useEffect(() => {
    if (!profile?.society_id || !supabase) return;

    const societyId = profile.society_id;

    async function fetchStats() {
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const [membersRes, ticketsRes, eventsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("society_id", societyId),
        supabase
          .from("tickets")
          .select("*", { count: "exact", head: true })
          .eq("society_id", societyId)
          .in("status", ["open", "in_progress", "escalated"]),
        supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("society_id", societyId)
          .eq("type", "event")
          .gte("created_at", sevenDaysAgo),
      ]);

      setMemberCount(membersRes.count ?? 0);
      setOpenTickets(ticketsRes.count ?? 0);
      setRecentEvents(eventsRes.count ?? 0);
    }

    fetchStats();
  }, [profile?.society_id, supabase]);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    }
    return null;
  }

  const displayName = profile?.full_name || user.email?.split("@")[0] || "there";

  const modules = [
    {
      icon: MessageCircle,
      title: "Community Feed",
      desc: "Posts, discussions & updates",
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/feed",
    },
    {
      icon: Mail,
      title: "Messages",
      desc: "Direct messages & chats",
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/messages",
    },
    {
      icon: Calendar,
      title: "Events",
      desc: "Upcoming society events",
      color: "text-primary",
      bg: "bg-primary/10",
      href: "#",
    },
    {
      icon: Users,
      title: "Neighbors",
      desc: "Society member directory",
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/neighbors",
    },
    {
      icon: Truck,
      title: "Vendor Tracker",
      desc: "Doodhwala, sabziwala status",
      color: "text-secondary",
      bg: "bg-secondary/10",
      href: "/vendors",
    },
    {
      icon: ClipboardList,
      title: "Complaints",
      desc: "Raise & track issues",
      color: "text-accent",
      bg: "bg-accent/10",
      href: "/complaints",
    },
    {
      icon: AlertTriangle,
      title: "Emergency SOS",
      desc: "Alert society instantly",
      color: "text-danger",
      bg: "bg-danger/10",
      href: "/sos",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
              M
            </div>
            <span className="text-lg font-bold text-foreground">
              My<span className="text-primary">Society</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
            >
              <UserCircle size={20} />
            </a>
            <button className="relative rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-foreground">
              <Bell size={20} />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{" "}
            <span className="text-primary">{displayName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Here&apos;s what&apos;s happening in your society today.
          </p>
        </div>

        {/* No Society Setup Card */}
        {!profile?.society_id && (
          <div className="mb-8 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Set up your profile
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Join or create a society to unlock all features like community
                  feed, complaints, vendors, and more.
                </p>
              </div>
              <a
                href="/profile"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Complete Profile
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm text-muted">Society Members</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {memberCount !== null ? memberCount : "--"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm text-muted">Open Complaints</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {openTickets !== null ? openTickets : "--"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm text-muted">Upcoming Events</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {recentEvents !== null ? recentEvents : "--"}
            </p>
          </div>
        </div>

        {/* Modules Grid */}
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Quick Access
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <a
              key={m.title}
              href={m.href}
              className="group rounded-xl border border-border bg-surface p-6 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${m.bg}`}
              >
                <m.icon size={22} className={m.color} />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary">
                {m.title}
              </h3>
              <p className="mt-1 text-sm text-muted">{m.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
