"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
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

interface Vendor {
  id: string;
  name: string;
  nameHi: string;
  category: string;
  icon: typeof Milk;
  phone: string;
  timing: string;
  status: "available" | "on_the_way" | "done_for_today" | "holiday";
  rating: number;
  area: string;
}

const STATUS_CONFIG = {
  available: { label: "Available", color: "text-success", bg: "bg-success/10", dot: "bg-success" },
  on_the_way: { label: "On the way", color: "text-warning", bg: "bg-warning/10", dot: "bg-warning" },
  done_for_today: { label: "Done for today", color: "text-muted", bg: "bg-surface-hover", dot: "bg-muted" },
  holiday: { label: "Holiday", color: "text-danger", bg: "bg-danger/10", dot: "bg-danger" },
};

const DEMO_VENDORS: Vendor[] = [
  {
    id: "1",
    name: "Ramesh Dairy",
    nameHi: "रमेश डेयरी",
    category: "Milk",
    icon: Milk,
    phone: "+91 98765 43210",
    timing: "5:30 AM – 7:30 AM",
    status: "on_the_way",
    rating: 4.5,
    area: "A, B, C Block",
  },
  {
    id: "2",
    name: "Santosh Sabziwala",
    nameHi: "संतोष सब्ज़ीवाला",
    category: "Vegetables",
    icon: Leaf,
    phone: "+91 98765 43211",
    timing: "7:00 AM – 10:00 AM",
    status: "available",
    rating: 4.2,
    area: "All Blocks",
  },
  {
    id: "3",
    name: "Anda Wala Bhaiya",
    nameHi: "अंडा वाला भैया",
    category: "Eggs",
    icon: Egg,
    phone: "+91 98765 43212",
    timing: "6:00 AM – 9:00 AM",
    status: "done_for_today",
    rating: 4.0,
    area: "Gate 1 entrance",
  },
  {
    id: "4",
    name: "Suresh Barber",
    nameHi: "सुरेश नाई",
    category: "Barber",
    icon: Scissors,
    phone: "+91 98765 43213",
    timing: "9:00 AM – 7:00 PM",
    status: "available",
    rating: 4.3,
    area: "Shop #3, Market Area",
  },
  {
    id: "5",
    name: "Sharma Plumber",
    nameHi: "शर्मा प्लम्बर",
    category: "Plumber",
    icon: Wrench,
    phone: "+91 98765 43214",
    timing: "On Call",
    status: "available",
    rating: 3.8,
    area: "All Blocks",
  },
  {
    id: "6",
    name: "Quick Drycleaner",
    nameHi: "क्विक ड्राई क्लीनर",
    category: "Laundry",
    icon: Shirt,
    phone: "+91 98765 43215",
    timing: "Pickup 8 AM, Delivery 6 PM",
    status: "available",
    rating: 4.1,
    area: "D, E Block",
  },
  {
    id: "7",
    name: "BigBasket Local",
    nameHi: "बिग बास्केट लोकल",
    category: "Grocery",
    icon: ShoppingBag,
    phone: "+91 98765 43216",
    timing: "8:00 AM – 9:00 PM",
    status: "available",
    rating: 4.4,
    area: "Home Delivery",
  },
  {
    id: "8",
    name: "Raju Gas Agency",
    nameHi: "राजू गैस एजेंसी",
    category: "Gas Cylinder",
    icon: Truck,
    phone: "+91 98765 43217",
    timing: "10:00 AM – 5:00 PM",
    status: "holiday",
    rating: 3.9,
    area: "All Blocks",
  },
];

export default function VendorsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  const filtered = DEMO_VENDORS.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.nameHi.includes(search) ||
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
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <Search size={32} className="mx-auto mb-2 text-muted" />
              <p className="text-sm text-muted">No vendors found.</p>
            </div>
          ) : (
            filtered.map((v) => {
              const status = STATUS_CONFIG[v.status];
              const Icon = v.icon;

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
                      <p className="text-xs text-muted">{v.nameHi}</p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {v.timing}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {v.area}
                        </span>
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
