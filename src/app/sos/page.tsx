"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import type { SOSAlert, EmergencyContact } from "@/types/database";
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

interface NationalContact {
  id: string;
  name: string;
  nameHi: string;
  number: string;
  icon: typeof Phone;
  color: string;
  bg: string;
}

const NATIONAL_EMERGENCY_CONTACTS: NationalContact[] = [
  {
    id: "nat-1",
    name: "Police",
    nameHi: "पुलिस",
    number: "100",
    icon: Shield,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "nat-2",
    name: "Fire Brigade",
    nameHi: "दमकल",
    number: "101",
    icon: Flame,
    color: "text-danger",
    bg: "bg-danger/10",
  },
  {
    id: "nat-3",
    name: "Ambulance",
    nameHi: "एम्बुलेंस",
    number: "102",
    icon: Stethoscope,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    id: "nat-4",
    name: "Women Helpline",
    nameHi: "महिला हेल्पलाइन",
    number: "1091",
    icon: Phone,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    id: "nat-5",
    name: "Disaster",
    nameHi: "आपदा प्रबंधन",
    number: "108",
    icon: Siren,
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

const CONTACT_TYPE_ICON: Record<string, typeof Phone> = {
  police: Shield,
  fire: Flame,
  ambulance: Stethoscope,
  security: Shield,
  other: Phone,
};

const CONTACT_TYPE_COLOR: Record<string, string> = {
  police: "text-primary",
  fire: "text-danger",
  ambulance: "text-success",
  security: "text-accent",
  other: "text-warning",
};

const CONTACT_TYPE_BG: Record<string, string> = {
  police: "bg-primary/10",
  fire: "bg-danger/10",
  ambulance: "bg-success/10",
  security: "bg-accent/10",
  other: "bg-warning/10",
};

function formatAlertAuthor(alert: SOSAlert): string {
  if (alert.author?.full_name) {
    const parts: string[] = [alert.author.full_name];
    if (alert.author.flat_no) {
      parts.push(
        alert.author.block
          ? `${alert.author.block}-${alert.author.flat_no}`
          : alert.author.flat_no
      );
    }
    return parts.join(", ");
  }
  return "Member";
}

export default function SOSPage() {
  const { user, profile, loading, supabase } = useUser();
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showSOS, setShowSOS] = useState(false);
  const [selectedType, setSelectedType] = useState(SOS_TYPES[0]);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch recent SOS alerts
  const fetchAlerts = useCallback(async () => {
    if (!profile?.society_id) return;

    const { data, error } = await supabase
      .from("sos_alerts")
      .select(
        "*, author:profiles(full_name, avatar_url, flat_no, block)"
      )
      .eq("society_id", profile.society_id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching SOS alerts:", error);
      return;
    }

    setAlerts((data as SOSAlert[]) || []);
  }, [profile?.society_id, supabase]);

  // Fetch emergency contacts
  const fetchContacts = useCallback(async () => {
    if (!profile?.society_id) return;

    const { data, error } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("society_id", profile.society_id);

    if (error) {
      console.error("Error fetching emergency contacts:", error);
      return;
    }

    setContacts((data as EmergencyContact[]) || []);
  }, [profile?.society_id, supabase]);

  // Initial data fetch
  useEffect(() => {
    if (!loading && profile?.society_id && user) {
      Promise.all([fetchAlerts(), fetchContacts()]).then(() =>
        setFetching(false)
      );
    } else if (!loading) {
      setFetching(false);
    }
  }, [loading, profile?.society_id, user, fetchAlerts, fetchContacts]);

  // Real-time subscription for new SOS alerts
  useEffect(() => {
    if (!profile?.society_id || !user) return;

    const channel = supabase
      .channel("sos-alerts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sos_alerts",
          filter: `society_id=eq.${profile.society_id}`,
        },
        async (payload) => {
          const newAlertRaw = payload.new as SOSAlert;

          // Fetch the full alert with author info
          const { data: fullAlert } = await supabase
            .from("sos_alerts")
            .select(
              "*, author:profiles(full_name, avatar_url, flat_no, block)"
            )
            .eq("id", newAlertRaw.id)
            .single();

          if (fullAlert) {
            setAlerts((prev) => {
              if (prev.some((a) => a.id === fullAlert.id)) return prev;
              return [fullAlert as SOSAlert, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.society_id, user, supabase]);

  // Send SOS alert
  const handleSendSOS = async () => {
    if (!message.trim() || !user || !profile?.society_id) return;

    setSending(true);

    const { error } = await supabase.from("sos_alerts").insert({
      society_id: profile.society_id,
      author_id: user.id,
      type: selectedType,
      message: message.trim(),
      location: location.trim() || null,
    });

    setSending(false);

    if (error) {
      console.error("Error sending SOS alert:", error);
      return;
    }

    setSent(true);
    setTimeout(() => {
      setSent(false);
      setShowSOS(false);
      setMessage("");
      setLocation("");
    }, 2000);
  };

  // Loading state
  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/auth";
    return null;
  }

  // No society set up yet
  if (!profile?.society_id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm rounded-xl border border-border bg-surface p-8 text-center">
          <AlertTriangle size={32} className="mx-auto mb-3 text-muted" />
          <h2 className="mb-2 text-lg font-bold text-foreground">
            Set Up Your Profile
          </h2>
          <p className="mb-4 text-sm text-muted">
            You need to join a society before you can use Emergency SOS.
            Please set up your profile first.
          </p>
          <a
            href="/profile"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Go to Profile
          </a>
        </div>
      </div>
    );
  }

  // Determine which contacts to display
  const hasDbContacts = contacts.length > 0;

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
              disabled={!message.trim() || sending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-danger py-3 text-sm font-bold text-white transition-colors hover:bg-danger/90 disabled:opacity-50"
            >
              {sending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Siren size={18} />
              )}
              {sending ? "SENDING..." : "SEND ALERT TO ALL MEMBERS"}
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
          {hasDbContacts
            ? contacts.map((c) => {
                const Icon =
                  CONTACT_TYPE_ICON[c.type] || Phone;
                const color =
                  CONTACT_TYPE_COLOR[c.type] || "text-muted";
                const bg =
                  CONTACT_TYPE_BG[c.type] || "bg-surface";
                return (
                  <a
                    key={c.id}
                    href={`tel:${c.phone.replace(/\s/g, "")}`}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${bg}`}
                    >
                      <Icon size={20} className={color} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-foreground">
                        {c.name}
                      </p>
                      {c.name_hi && (
                        <p className="text-[10px] text-muted">
                          {c.name_hi}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs font-bold text-primary">
                        {c.phone}
                      </p>
                    </div>
                  </a>
                );
              })
            : NATIONAL_EMERGENCY_CONTACTS.map((c) => {
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
          {alerts.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <AlertTriangle size={32} className="mx-auto mb-2 text-muted" />
              <p className="text-sm text-muted">
                No recent alerts. Stay safe!
              </p>
            </div>
          ) : (
            alerts.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-danger/20 bg-danger/5 p-4"
              >
                <div className="mb-1 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-danger" />
                  <span className="text-xs font-bold text-danger">
                    {a.type}
                  </span>
                  <span className="text-[10px] text-muted">
                    by {formatAlertAuthor(a)}
                  </span>
                </div>
                <p className="mb-2 text-sm text-foreground">{a.message}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted">
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {a.location || "Not specified"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(a.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
