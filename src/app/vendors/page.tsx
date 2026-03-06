"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import type { Vendor } from "@/types/database";
import {
  ArrowLeft,
  Phone,
  Star,
  Clock,
  MapPin,
  Search,
  Milk,
  Leaf,
  Egg,
  Scissors,
  Wrench,
  Shirt,
  Truck,
  ShoppingBag,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, typeof Milk> = {
  Milk,
  Vegetables: Leaf,
  Eggs: Egg,
  Barber: Scissors,
  Plumber: Wrench,
  Laundry: Shirt,
  Grocery: ShoppingBag,
  "Gas Cylinder": Truck,
};

const STATUS_CONFIG = {
  available: { label: "Available", color: "text-success", bg: "bg-success/10", dot: "bg-success" },
  on_the_way: { label: "On the way", color: "text-warning", bg: "bg-warning/10", dot: "bg-warning" },
  done_for_today: { label: "Done for today", color: "text-muted", bg: "bg-surface-hover", dot: "bg-muted" },
  holiday: { label: "Holiday", color: "text-danger", bg: "bg-danger/10", dot: "bg-danger" },
};

export default function VendorsPage() {
  const { user, profile, loading, supabase } = useUser();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");

  const fetchVendors = useCallback(async () => {
    if (!profile?.society_id) return;

    setFetching(true);

    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("society_id", profile.society_id)
      .order("category");

    if (error) {
      console.error("Error fetching vendors:", error);
      setFetching(false);
      return;
    }

    setVendors((data as Vendor[]) || []);
    setFetching(false);
  }, [profile?.society_id, supabase]);

  useEffect(() => {
    if (!loading && profile?.society_id) {
      fetchVendors();
    } else if (!loading) {
      setFetching(false);
    }
  }, [loading, profile?.society_id, fetchVendors]);

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.name_hi && v.name_hi.includes(search)) ||
      v.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/auth";
    return null;
  }

  if (!profile?.society_id) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
            <a
              href="/dashboard"
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </a>
            <h1 className="text-lg font-bold text-foreground">Vendor Tracker</h1>
          </div>
        </nav>
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-sm text-muted">Set up profile first</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <a
            href="/dashboard"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <ArrowLeft size={20} />
          </a>
          <h1 className="text-lg font-bold text-foreground">Vendor Tracker</h1>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors... (milk, plumber, sabzi)"
            className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status Legend */}
        <div className="mb-4 flex flex-wrap gap-3 text-[10px] text-muted">
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <span key={key} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${val.dot}`} />
              {val.label}
            </span>
          ))}
        </div>

        {/* Vendor Cards */}
        <div className="space-y-3">
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <p className="text-sm text-muted">No vendors added yet.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <Search size={32} className="mx-auto mb-2 text-muted" />
              <p className="text-sm text-muted">No vendors found.</p>
            </div>
          ) : (
            filtered.map((v) => {
              const status = STATUS_CONFIG[v.status];
              const Icon = CATEGORY_ICONS[v.category] || ShoppingBag;

              return (
                <div
                  key={v.id}
                  className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border/80"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon size={22} className="text-primary" />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-foreground">
                          {v.name}
                        </h3>
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      {v.name_hi && <p className="text-xs text-muted">{v.name_hi}</p>}

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                        {v.timing && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {v.timing}
                          </span>
                        )}
                        {v.area && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {v.area}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-warning" />
                          {v.rating}
                        </span>
                      </div>
                    </div>

                    {/* Call Button */}
                    <a
                      href={`tel:${v.phone.replace(/\s/g, "")}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success transition-colors hover:bg-success/20"
                    >
                      <Phone size={18} />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
