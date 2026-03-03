"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Filter,
  MessageCircle,
  HelpCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import CreatePost from "@/components/CreatePost";
import FeedPost, { type Post } from "@/components/FeedPost";

const FILTERS = [
  { value: "all", label: "All", icon: null },
  { value: "general", label: "General", icon: MessageCircle },
  { value: "question", label: "Questions", icon: HelpCircle },
  { value: "alert", label: "Alerts", icon: AlertTriangle },
  { value: "event", label: "Events", icon: Calendar },
] as const;

// Demo posts for now — will be replaced with Supabase queries
const DEMO_POSTS: Post[] = [
  {
    id: "1",
    type: "alert",
    content:
      "Water supply will be shut off tomorrow (March 4) from 10 AM to 2 PM for tank cleaning. Please store water accordingly.",
    author: "secretary",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    likes: 12,
    comments: 3,
    liked: false,
  },
  {
    id: "2",
    type: "general",
    content:
      "Has anyone seen a grey Persian cat near B-block? She's been missing since yesterday evening. Name is Mitthu. Please contact flat B-204 if found. 🐱",
    author: "priya_204",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    likes: 8,
    comments: 5,
    liked: false,
  },
  {
    id: "3",
    type: "question",
    content:
      "Can anyone recommend a reliable electrician? Need to fix some wiring issues in my flat. Budget-friendly please!",
    author: "rahul_105",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likes: 3,
    comments: 7,
    liked: false,
  },
  {
    id: "4",
    type: "event",
    content:
      "Holi celebration in the society garden this Sunday at 11 AM! Colors, water balloons, and DJ music. Kids activities from 10 AM. Everyone is welcome! 🎨",
    author: "cultural_committee",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    likes: 24,
    comments: 11,
    liked: false,
  },
  {
    id: "5",
    type: "alert",
    content:
      "Lift in A-block is under maintenance today. Please use the stairs or B-block lift. Sorry for the inconvenience.",
    author: "maintenance",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    likes: 5,
    comments: 2,
    liked: false,
  },
  {
    id: "6",
    type: "general",
    content:
      "Monthly maintenance bill for February is due. Please pay by March 10 to avoid late charges. UPI: society@upi",
    author: "treasurer",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    likes: 6,
    comments: 4,
    liked: false,
  },
];

type FilterType = (typeof FILTERS)[number]["value"];

export default function FeedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>(DEMO_POSTS);
  const [filter, setFilter] = useState<FilterType>("all");

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

  const handleNewPost = (newPost: {
    type: Post["type"];
    content: string;
    author: string;
  }) => {
    const post: Post = {
      id: Date.now().toString(),
      ...newPost,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      liked: false,
    };
    setPosts((prev) => [post, ...prev]);
  };

  const handleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              liked: !p.liked,
              likes: p.liked ? p.likes - 1 : p.likes + 1,
            }
          : p
      )
    );
  };

  const filtered =
    filter === "all" ? posts : posts.filter((p) => p.type === filter);

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
            <h1 className="text-lg font-bold text-foreground">
              Community Feed
            </h1>
          </div>
          <button className="rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-foreground">
            <Filter size={18} />
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-4">
        {/* Create Post */}
        <div className="mb-4">
          <CreatePost
            userEmail={user.email || "user"}
            onPost={handleNewPost}
          />
        </div>

        {/* Filter Tabs */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {f.icon && <f.icon size={14} />}
              {f.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <MessageCircle
                size={32}
                className="mx-auto mb-2 text-muted"
              />
              <p className="text-sm text-muted">
                No posts yet. Be the first to share!
              </p>
            </div>
          ) : (
            filtered.map((post) => (
              <FeedPost key={post.id} post={post} onLike={handleLike} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
