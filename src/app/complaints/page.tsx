"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import type { Ticket, TicketComment } from "@/types/database";
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
  ShieldAlert,
  XCircle,
  ArrowUpRight,
  User,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

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

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-gray-500", bg: "bg-gray-500/10" },
  {
    value: "medium",
    label: "Medium",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    value: "high",
    label: "High",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    value: "urgent",
    label: "Urgent",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
] as const;

type PriorityValue = (typeof PRIORITIES)[number]["value"];

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
  escalated: {
    label: "Escalated",
    icon: ShieldAlert,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle,
    color: "text-success",
    bg: "bg-success/10",
  },
  closed: {
    label: "Closed",
    icon: XCircle,
    color: "text-muted",
    bg: "bg-surface-hover",
  },
};

const ESCALATION_LABELS: Record<number, string> = {
  0: "Open",
  1: "Secretary",
  2: "Chairman",
  3: "Management",
};

const FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
];

/* ------------------------------------------------------------------ */
/*  Extended local type (ticket + UI flags)                            */
/* ------------------------------------------------------------------ */

interface TicketWithUI extends Ticket {
  upvoted: boolean;
  comments: TicketComment[];
  commentsLoaded: boolean;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ComplaintsPage() {
  const { user, profile, loading, supabase } = useUser();

  const [tickets, setTickets] = useState<TicketWithUI[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState<PriorityValue>("medium");
  const [submitting, setSubmitting] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Escalation loading state
  const [escalating, setEscalating] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Fetch Tickets                                                    */
  /* ---------------------------------------------------------------- */

  const fetchTickets = useCallback(async () => {
    if (!profile?.society_id || !user) return;

    setFetching(true);

    const { data: rawTickets, error: ticketsError } = await supabase
      .from("tickets")
      .select(
        "*, author:profiles!author_id(full_name, avatar_url), assignee:profiles!assigned_to(full_name)"
      )
      .eq("society_id", profile.society_id)
      .order("created_at", { ascending: false });

    if (ticketsError) {
      console.error("Error fetching tickets:", ticketsError);
      setFetching(false);
      return;
    }

    if (!rawTickets || rawTickets.length === 0) {
      setTickets([]);
      setFetching(false);
      return;
    }

    // Fetch user's upvotes
    const ticketIds = rawTickets.map((t: Ticket) => t.id);
    const { data: upvotedTickets } = await supabase
      .from("ticket_upvotes")
      .select("ticket_id")
      .eq("user_id", user.id)
      .in("ticket_id", ticketIds);

    const upvotedSet = new Set(
      (upvotedTickets || []).map(
        (u: { ticket_id: string }) => u.ticket_id
      )
    );

    const assembled: TicketWithUI[] = rawTickets.map((t: Ticket) => ({
      ...t,
      upvoted: upvotedSet.has(t.id),
      comments: [],
      commentsLoaded: false,
    }));

    setTickets(assembled);
    setFetching(false);
  }, [profile?.society_id, user, supabase]);

  /* ---------------------------------------------------------------- */
  /*  Initial fetch                                                    */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!loading && profile?.society_id && user) {
      fetchTickets();
    } else if (!loading) {
      setFetching(false);
    }
  }, [loading, profile?.society_id, user, fetchTickets]);

  /* ---------------------------------------------------------------- */
  /*  Fetch comments for a ticket (lazy-loaded on expand)              */
  /* ---------------------------------------------------------------- */

  const fetchComments = useCallback(
    async (ticketId: string) => {
      const { data: rawComments, error } = await supabase
        .from("ticket_comments")
        .select("*, author:profiles(full_name, avatar_url)")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
        return;
      }

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                comments: (rawComments as TicketComment[]) || [],
                commentsLoaded: true,
              }
            : t
        )
      );
    },
    [supabase]
  );

  /* ---------------------------------------------------------------- */
  /*  Handle expand / collapse (load comments on first expand)         */
  /* ---------------------------------------------------------------- */

  const handleToggleExpand = useCallback(
    (ticketId: string) => {
      if (expanded === ticketId) {
        setExpanded(null);
        return;
      }
      setExpanded(ticketId);

      // Lazy-load comments if not already loaded
      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket && !ticket.commentsLoaded) {
        fetchComments(ticketId);
      }
    },
    [expanded, tickets, fetchComments]
  );

  /* ---------------------------------------------------------------- */
  /*  Create ticket                                                    */
  /* ---------------------------------------------------------------- */

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !description.trim() || !user || !profile?.society_id)
      return;

    setSubmitting(true);

    const { data: inserted, error } = await supabase
      .from("tickets")
      .insert({
        society_id: profile.society_id,
        author_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      })
      .select(
        "*, author:profiles!author_id(full_name, avatar_url), assignee:profiles!assigned_to(full_name)"
      )
      .single();

    if (error) {
      console.error("Error creating ticket:", error);
      setSubmitting(false);
      return;
    }

    if (inserted) {
      const newTicket: TicketWithUI = {
        ...(inserted as Ticket),
        upvoted: false,
        comments: [],
        commentsLoaded: false,
      };
      setTickets((prev) => [newTicket, ...prev]);
    }

    setTitle("");
    setDescription("");
    setCategory(CATEGORIES[0]);
    setPriority("medium");
    setShowForm(false);
    setSubmitting(false);
  }, [title, description, category, priority, user, profile, supabase]);

  /* ---------------------------------------------------------------- */
  /*  Toggle upvote                                                    */
  /* ---------------------------------------------------------------- */

  const handleUpvote = useCallback(
    async (ticketId: string) => {
      if (!user) return;

      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return;

      // Optimistic update
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                upvoted: !t.upvoted,
                upvotes_count: t.upvoted
                  ? t.upvotes_count - 1
                  : t.upvotes_count + 1,
              }
            : t
        )
      );

      if (ticket.upvoted) {
        // Remove upvote
        const { error } = await supabase
          .from("ticket_upvotes")
          .delete()
          .eq("ticket_id", ticketId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error removing upvote:", error);
          // Revert
          setTickets((prev) =>
            prev.map((t) =>
              t.id === ticketId
                ? { ...t, upvoted: true, upvotes_count: t.upvotes_count + 1 }
                : t
            )
          );
        }
      } else {
        // Add upvote
        const { error } = await supabase
          .from("ticket_upvotes")
          .insert({ ticket_id: ticketId, user_id: user.id });

        if (error) {
          console.error("Error adding upvote:", error);
          // Revert
          setTickets((prev) =>
            prev.map((t) =>
              t.id === ticketId
                ? { ...t, upvoted: false, upvotes_count: t.upvotes_count - 1 }
                : t
            )
          );
        }
      }
    },
    [user, tickets, supabase]
  );

  /* ---------------------------------------------------------------- */
  /*  Escalate ticket                                                  */
  /* ---------------------------------------------------------------- */

  const handleEscalate = useCallback(
    async (ticketId: string) => {
      if (!user) return;

      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return;
      if (ticket.author_id !== user.id) return; // only author can escalate
      if (ticket.escalation_level >= 3) return; // max level reached

      const newLevel = ticket.escalation_level + 1;
      setEscalating(ticketId);

      // Optimistic update
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, escalation_level: newLevel, status: "escalated" as const }
            : t
        )
      );

      const { error } = await supabase
        .from("tickets")
        .update({ escalation_level: newLevel, status: "escalated" })
        .eq("id", ticketId);

      if (error) {
        console.error("Error escalating ticket:", error);
        // Revert
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  escalation_level: ticket.escalation_level,
                  status: ticket.status,
                }
              : t
          )
        );
      }

      setEscalating(null);
    },
    [user, tickets, supabase]
  );

  /* ---------------------------------------------------------------- */
  /*  Submit comment                                                   */
  /* ---------------------------------------------------------------- */

  const handleCommentSubmit = useCallback(
    async (ticketId: string) => {
      if (!commentText.trim() || !user || !profile) return;

      setCommentSubmitting(true);

      const optimisticComment: TicketComment = {
        id: `temp-${Date.now()}`,
        ticket_id: ticketId,
        author_id: user.id,
        content: commentText.trim(),
        is_internal: false,
        created_at: new Date().toISOString(),
        author: {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        },
      };

      // Optimistic update
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, comments: [...t.comments, optimisticComment] }
            : t
        )
      );
      setCommentText("");

      const { data: inserted, error } = await supabase
        .from("ticket_comments")
        .insert({
          ticket_id: ticketId,
          author_id: user.id,
          content: optimisticComment.content,
        })
        .select("*, author:profiles(full_name, avatar_url)")
        .single();

      if (error) {
        console.error("Error adding comment:", error);
        // Revert
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  comments: t.comments.filter(
                    (c) => c.id !== optimisticComment.id
                  ),
                }
              : t
          )
        );
        setCommentText(optimisticComment.content);
      } else if (inserted) {
        // Replace optimistic comment with real one
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  comments: t.comments.map((c) =>
                    c.id === optimisticComment.id
                      ? (inserted as TicketComment)
                      : c
                  ),
                }
              : t
          )
        );
      }

      setCommentSubmitting(false);
    },
    [commentText, user, profile, supabase]
  );

  /* ---------------------------------------------------------------- */
  /*  Filtered tickets                                                 */
  /* ---------------------------------------------------------------- */

  const filtered =
    statusFilter === "all"
      ? tickets
      : tickets.filter((t) => t.status === statusFilter);

  /* ---------------------------------------------------------------- */
  /*  Helper: priority config                                          */
  /* ---------------------------------------------------------------- */

  const getPriorityConfig = (value: string) =>
    PRIORITIES.find((p) => p.value === value) || PRIORITIES[0];

  /* ---------------------------------------------------------------- */
  /*  Render: loading                                                  */
  /* ---------------------------------------------------------------- */

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render: not authenticated                                        */
  /* ---------------------------------------------------------------- */

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/auth";
    return null;
  }

  /* ---------------------------------------------------------------- */
  /*  Render: no society                                               */
  /* ---------------------------------------------------------------- */

  if (!profile?.society_id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm rounded-xl border border-border bg-surface p-8 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-muted" />
          <h2 className="mb-2 text-lg font-bold text-foreground">
            Set Up Your Profile
          </h2>
          <p className="mb-4 text-sm text-muted">
            You need to join a society before you can access the complaints
            board. Please set up your profile first.
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

  /* ---------------------------------------------------------------- */
  /*  Render: main page                                                */
  /* ---------------------------------------------------------------- */

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

            {/* Category Selection */}
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

            {/* Priority Selection */}
            <div className="mb-3">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Priority
              </span>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      priority === p.value
                        ? `${p.bg} ${p.color} ring-1 ring-current`
                        : "bg-surface-hover text-muted hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !description.trim() || submitting}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <Send size={14} />
              {submitting ? "Submitting..." : "Submit Complaint"}
            </button>
          </div>
        )}

        {/* Status Filter */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {FILTER_TABS.map((f) => (
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

        {/* Tickets List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <CheckCircle size={32} className="mx-auto mb-2 text-success" />
              <p className="text-sm text-muted">
                No complaints in this category.
              </p>
            </div>
          ) : (
            filtered.map((ticket) => {
              const status = STATUS_CONFIG[ticket.status];
              const StatusIcon = status.icon;
              const isExpanded = expanded === ticket.id;
              const priorityConfig = getPriorityConfig(ticket.priority);
              const canEscalate =
                user.id === ticket.author_id &&
                ticket.escalation_level < 3 &&
                ticket.status !== "resolved" &&
                ticket.status !== "closed";

              return (
                <div
                  key={ticket.id}
                  className="rounded-xl border border-border bg-surface transition-colors hover:border-border/80"
                >
                  {/* Header */}
                  <div
                    className="cursor-pointer p-4"
                    onClick={() => handleToggleExpand(ticket.id)}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-snug text-foreground">
                        {ticket.title}
                      </h3>
                      {isExpanded ? (
                        <ChevronUp
                          size={16}
                          className="shrink-0 text-muted"
                        />
                      ) : (
                        <ChevronDown
                          size={16}
                          className="shrink-0 text-muted"
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Badge */}
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.bg} ${status.color}`}
                      >
                        <StatusIcon size={10} />
                        {status.label}
                      </span>
                      {/* Priority Badge */}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityConfig.bg} ${priorityConfig.color}`}
                      >
                        {priorityConfig.label}
                      </span>
                      {/* Category Badge */}
                      <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-medium text-muted">
                        {ticket.category}
                      </span>
                      {/* Escalation Badge */}
                      {ticket.escalation_level > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-500">
                          <ArrowUpRight size={10} />
                          Escalated to {ESCALATION_LABELS[ticket.escalation_level]}
                        </span>
                      )}
                      {/* Author */}
                      <span className="text-[10px] text-muted">
                        by {ticket.author?.full_name || "Unknown"}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-3">
                      <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {ticket.description}
                      </p>
                      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted">
                        <span>
                          {new Date(ticket.created_at).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        {ticket.assignee?.full_name && (
                          <span>Assigned to {ticket.assignee.full_name}</span>
                        )}
                        {ticket.resolved_at && (
                          <span>
                            Resolved{" "}
                            {new Date(ticket.resolved_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                              }
                            )}
                          </span>
                        )}
                      </div>

                      {/* Escalation Matrix */}
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[0, 1, 2, 3].map((level) => (
                            <div
                              key={level}
                              className={`h-1.5 w-6 rounded-full ${
                                level <= ticket.escalation_level
                                  ? level === 0
                                    ? "bg-success"
                                    : level === 1
                                      ? "bg-amber-500"
                                      : level === 2
                                        ? "bg-orange-500"
                                        : "bg-red-500"
                                  : "bg-surface-hover"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted">
                          Level {ticket.escalation_level}:{" "}
                          {ESCALATION_LABELS[ticket.escalation_level]}
                        </span>
                      </div>

                      {/* Escalate Button */}
                      {canEscalate && (
                        <button
                          onClick={() => handleEscalate(ticket.id)}
                          disabled={escalating === ticket.id}
                          className="mb-3 flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-500 transition-colors hover:bg-orange-500/20 disabled:opacity-50"
                        >
                          <ArrowUpRight size={14} />
                          {escalating === ticket.id
                            ? "Escalating..."
                            : `Escalate to ${ESCALATION_LABELS[ticket.escalation_level + 1]}`}
                        </button>
                      )}
                      {user.id === ticket.author_id &&
                        ticket.escalation_level >= 3 &&
                        ticket.status !== "resolved" &&
                        ticket.status !== "closed" && (
                          <p className="mb-3 text-[10px] text-muted">
                            Maximum escalation level reached.
                          </p>
                        )}

                      {/* Comments Thread */}
                      <div className="border-t border-border pt-3">
                        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <MessageSquare size={12} />
                          Comments
                        </h4>

                        {/* Comments List */}
                        {!ticket.commentsLoaded ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          </div>
                        ) : ticket.comments.length === 0 ? (
                          <p className="py-2 text-xs text-muted">
                            No comments yet. Be the first to comment.
                          </p>
                        ) : (
                          <div className="mb-3 space-y-3">
                            {ticket.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="flex gap-2.5"
                              >
                                {/* Avatar */}
                                <div className="shrink-0">
                                  {comment.author?.avatar_url ? (
                                    <img
                                      src={comment.author.avatar_url}
                                      alt=""
                                      className="h-6 w-6 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-hover">
                                      <User size={12} className="text-muted" />
                                    </div>
                                  )}
                                </div>
                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-xs font-semibold text-foreground">
                                      {comment.author?.full_name || "Unknown"}
                                    </span>
                                    <span className="text-[10px] text-muted">
                                      {new Date(
                                        comment.created_at
                                      ).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comment Input */}
                        <div className="flex gap-2">
                          <input
                            value={expanded === ticket.id ? commentText : ""}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleCommentSubmit(ticket.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleCommentSubmit(ticket.id)}
                            disabled={
                              !commentText.trim() || commentSubmitting
                            }
                            className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                          >
                            <Send size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex border-t border-border">
                    <button
                      onClick={() => handleUpvote(ticket.id)}
                      className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                        ticket.upvoted
                          ? "text-primary"
                          : "text-muted hover:bg-surface-hover hover:text-foreground"
                      }`}
                    >
                      <ChevronUp size={16} />
                      Upvote{" "}
                      {ticket.upvotes_count > 0 &&
                        `(${ticket.upvotes_count})`}
                    </button>
                    <button
                      onClick={() => handleToggleExpand(ticket.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 border-l border-border py-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                    >
                      <MessageSquare size={14} />
                      Comments
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
