"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  AlertTriangle,
  Phone,
  Shield,
  Flame,
  Stethoscope,
  Siren,
  MapPin,
  Clock,
} from "lucide-react";

interface EmergencyContact {
  id: string;
  name: string;
  nameHi: string;
  number: string;
  icon: typeof Phone;
  color: string;
  bg: string;
}

interface SOSAlert {
  id: string;
  type: string;
  message: string;
  author: string;
  timestamp: string;
  location: string;
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: "1",
    name: "Police",
    nameHi: "पुलिस",
    number: "100",
    icon: Shield,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "2",
    name: "Fire Brigade",
    nameHi: "दमकल",
    number: "101",
    icon: Flame,
    color: "text-danger",
    bg: "bg-danger/10",
  },
  {
    id: "3",
    name: "Ambulance",
    nameHi: "एम्बुलेंस",
    number: "102",
    icon: Stethoscope,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    id: "4",
    name: "Emergency",
    nameHi: "आपातकालीन",
    number: "112",
    icon: Siren,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    id: "5",
    name: "Society Security",
    nameHi: "सोसाइटी सिक्योरिटी",
    number: "+91 98765 00000",
    icon: Shield,
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

const SOS_TYPES = [
  "Medical Emergency",
  "Fire",
  "Theft / Break-in",
  "Gas Leak",
  "Water Flooding",
  "Suspicious Activity",
  "Power Outage",
  "Other",
];

const DEMO_ALERTS: SOSAlert[] = [
  {
    id: "1",
    type: "Medical Emergency",
    message: "Elderly person fell down in C-block staircase. Need help immediately!",
    author: "neha_c302",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    location: "C-Block, 3rd Floor Staircase",
  },
  {
    id: "2",
    type: "Gas Leak",
    message: "Strong gas smell near D-block ground floor. Everyone please stay alert.",
    author: "security_guard",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    location: "D-Block, Ground Floor",
  },
];

export default function SOSPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<SOSAlert[]>(DEMO_ALERTS);
  const [showSOS, setShowSOS] = useState(false);
  const [selectedType, setSelectedType] = useState(SOS_TYPES[0]);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState("");
  const [sent, setSent] = useState(false);

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

  const handleSendSOS = () => {
    if (!message.trim()) return;
    const alert: SOSAlert = {
      id: Date.now().toString(),
      type: selectedType,
      message: message.trim(),
      author: user?.email?.split("@")[0] || "user",
      timestamp: new Date().toISOString(),
      location: location.trim() || "Not specified",
    };
    setAlerts((prev) => [alert, ...prev]);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setShowSOS(false);
      setMessage("");
      setLocation("");
    }, 2000);
  };

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
          <h1 className="text-lg font-bold text-foreground">Emergency SOS</h1>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-4">
        {/* SOS Button */}
        <div className="mb-6 text-center">
          <button
            onClick={() => setShowSOS(!showSOS)}
            className="group relative mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-danger text-white shadow-lg shadow-danger/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-danger/40 active:scale-95"
          >
            <div className="absolute inset-0 animate-ping rounded-full bg-danger/20" />
            <div className="text-center">
              <AlertTriangle size={36} className="mx-auto mb-1" />
              <span className="text-sm font-bold">SOS</span>
            </div>
          </button>
          <p className="mt-3 text-xs text-muted">
            Tap to alert all society members instantly
          </p>
        </div>

        {/* SOS Form */}
        {showSOS && !sent && (
          <div className="mb-6 rounded-xl border-2 border-danger/30 bg-danger/5 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-danger">
              <AlertTriangle size={16} />
              Send Emergency Alert
            </h3>

            {/* Type */}
            <div className="mb-3 flex flex-wrap gap-2">
              {SOS_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedType === t
                      ? "bg-danger text-white"
                      : "bg-surface text-muted hover:bg-surface-hover"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Message */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the emergency..."
              rows={2}
              className="mb-3 w-full resize-none rounded-lg border border-danger/30 bg-background p-3 text-sm text-foreground placeholder:text-muted focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger"
              autoFocus
            />

            {/* Location */}
            <div className="relative mb-3">
              <MapPin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (e.g., A-Block 3rd Floor)"
                className="w-full rounded-lg border border-danger/30 bg-background py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger"
              />
            </div>

            <button
              onClick={handleSendSOS}
              disabled={!message.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-danger py-3 text-sm font-bold text-white transition-colors hover:bg-danger/90 disabled:opacity-50"
            >
              <Siren size={18} />
              SEND ALERT TO ALL MEMBERS
            </button>
          </div>
        )}

        {/* Sent Confirmation */}
        {sent && (
          <div className="mb-6 rounded-xl border-2 border-success/30 bg-success/5 p-6 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <Siren size={24} className="text-success" />
            </div>
            <h3 className="text-sm font-bold text-success">Alert Sent!</h3>
            <p className="mt-1 text-xs text-muted">
              All society members have been notified.
            </p>
          </div>
        )}

        {/* Emergency Contacts */}
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Emergency Contacts
        </h2>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {EMERGENCY_CONTACTS.map((c) => {
            const Icon = c.icon;
            return (
              <a
                key={c.id}
                href={`tel:${c.number.replace(/\s/g, "")}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${c.bg}`}
                >
                  <Icon size={20} className={c.color} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-foreground">
                    {c.name}
                  </p>
                  <p className="text-[10px] text-muted">{c.nameHi}</p>
                  <p className="mt-0.5 text-xs font-bold text-primary">
                    {c.number}
                  </p>
                </div>
              </a>
            );
          })}
        </div>

        {/* Recent Alerts */}
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Recent Alerts
        </h2>
        <div className="space-y-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-danger/20 bg-danger/5 p-4"
            >
              <div className="mb-1 flex items-center gap-2">
                <AlertTriangle size={14} className="text-danger" />
                <span className="text-xs font-bold text-danger">{a.type}</span>
                <span className="text-[10px] text-muted">by {a.author}</span>
              </div>
              <p className="mb-2 text-sm text-foreground">{a.message}</p>
              <div className="flex items-center gap-3 text-[10px] text-muted">
                <span className="flex items-center gap-1">
                  <MapPin size={10} />
                  {a.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(a.timestamp).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
