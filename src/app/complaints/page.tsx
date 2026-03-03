"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Plus,
  X,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "open" | "in_progress" | "resolved";
  author: string;
  timestamp: string;
  upvotes: number;
  upvoted: boolean;
  replies: number;
}

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Lift / Elevator",
  "Parking",
  "Cleanliness",
  "Security",
  "Noise",
  "Water Supply",
  "Common Area",
  "Other",
];

const STATUS_CONFIG = {
  open: {
    label: "Open",
    icon: AlertCircle,
    color: "text-danger",
    bg: "bg-danger/10",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle,
    color: "text-success",
    bg: "bg-success/10",
  },
};

const DEMO_COMPLAINTS: Complaint[] = [
  {
    id: "1",
    title: "Water leakage from terrace in B-block",
    description:
      "There is continuous water seepage from the terrace slab into flat B-501. The ceiling plaster is also coming off. This has been happening for 2 weeks now. Please fix urgently.",
    category: "Plumbing",
    status: "open",
    author: "amit_501",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    upvotes: 8,
    upvoted: false,
    replies: 3,
  },
  {
    id: "2",
    title: "Lift breakdown in A-block — 3rd time this month",
    description:
      "A-block lift stopped working again today morning. This is the 3rd breakdown this month. The AMC company needs to be changed. Residents above 5th floor are severely affected.",
    category: "Lift / Elevator",
    status: "in_progress",
    author: "sunita_a302",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    upvotes: 15,
    upvoted: false,
    replies: 7,
  },
  {
    id: "3",
    title: "Stray dogs issue near gate 2",
    description:
      "A pack of stray dogs has been sitting near gate 2 every evening. They bark aggressively at residents and children are scared to go out. Need a humane solution.",
    category: "Security",
    status: "open",
    author: "priya_c101",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    upvotes: 12,
    upvoted: false,
    replies: 5,
  },
  {
    id: "4",
    title: "Garbage not collected from D-block for 2 days",
    description:
      "The garbage collector has not come to D-block since Monday. Dustbins are overflowing. Bad smell is spreading in the corridor. Please escalate with the vendor.",
    category: "Cleanliness",
    status: "resolved",
    author: "rajesh_d204",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    upvotes: 6,
    upvoted: false,
    replies: 4,
  },
  {
    id: "5",
    title: "Parking spot encroachment by visitor vehicles",
    description:
      "Visitors are regularly parking in reserved spots of A-block residents. The security guards are not checking parking stickers. Need stricter enforcement.",
    category: "Parking",
    status: "open",
    author: "vikram_a105",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    upvotes: 9,
    upvoted: false,
    replies: 6,
  },
];

export default function ComplaintsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>(DEMO_COMPLAINTS);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

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

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    const newComplaint: Complaint = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      category,
      status: "open",
      author: user?.email?.split("@")[0] || "user",
      timestamp: new Date().toISOString(),
      upvotes: 0,
      upvoted: false,
      replies: 0,
    };
    setComplaints((prev) => [newComplaint, ...prev]);
    setTitle("");
    setDescription("");
    setCategory(CATEGORIES[0]);
    setShowForm(false);
  };

  const handleUpvote = (id: string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              upvoted: !c.upvoted,
              upvotes: c.upvoted ? c.upvotes - 1 : c.upvotes + 1,
            }
          : c
      )
    );
  };

  const filtered =
    statusFilter === "all"
      ? complaints
      : complaints.filter((c) => c.status === statusFilter);

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
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </a>
            <h1 className="text-lg font-bold text-foreground">Complaints</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Cancel" : "Raise"}
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-4">
        {/* New Complaint Form */}
        {showForm && (
          <div className="mb-4 rounded-xl border border-primary/30 bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Raise a Complaint
            </h3>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title of your complaint"
              className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={3}
              className="mb-3 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="mb-3 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    category === cat
                      ? "bg-primary text-white"
                      : "bg-surface-hover text-muted hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !description.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <Send size={14} />
              Submit Complaint
            </button>
          </div>
        )}

        {/* Status Filter */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {[
            { value: "all", label: "All" },
            { value: "open", label: "Open" },
            { value: "in_progress", label: "In Progress" },
            { value: "resolved", label: "Resolved" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Complaints List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <CheckCircle size={32} className="mx-auto mb-2 text-success" />
              <p className="text-sm text-muted">No complaints in this category.</p>
            </div>
          ) : (
            filtered.map((c) => {
              const status = STATUS_CONFIG[c.status];
              const StatusIcon = status.icon;
              const isExpanded = expanded === c.id;

              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-border bg-surface transition-colors hover:border-border/80"
                >
                  {/* Header */}
                  <div
                    className="cursor-pointer p-4"
                    onClick={() => setExpanded(isExpanded ? null : c.id)}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground leading-snug">
                        {c.title}
                      </h3>
                      {isExpanded ? (
                        <ChevronUp size={16} className="shrink-0 text-muted" />
                      ) : (
                        <ChevronDown size={16} className="shrink-0 text-muted" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.bg} ${status.color}`}
                      >
                        <StatusIcon size={10} />
                        {status.label}
                      </span>
                      <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-medium text-muted">
                        {c.category}
                      </span>
                      <span className="text-[10px] text-muted">
                        by {c.author}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-3">
                      <p className="mb-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {c.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span>
                          {new Date(c.timestamp).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex border-t border-border">
                    <button
                      onClick={() => handleUpvote(c.id)}
                      className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                        c.upvoted
                          ? "text-primary"
                          : "text-muted hover:bg-surface-hover hover:text-foreground"
                      }`}
                    >
                      <ChevronUp size={16} />
                      Upvote {c.upvotes > 0 && `(${c.upvotes})`}
                    </button>
                    <button className="flex flex-1 items-center justify-center gap-1.5 border-l border-border py-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground">
                      <MessageSquare size={14} />
                      Reply {c.replies > 0 && `(${c.replies})`}
                    </button>
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
