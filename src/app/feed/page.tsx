"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  MessageCircle,
  HelpCircle,
  AlertTriangle,
  Calendar,
  Mail,
} from "lucide-react";
import CreatePost from "@/components/CreatePost";
import FeedPost, { type Post, type Comment } from "@/components/FeedPost";

const FILTERS = [
  { value: "all", label: "All", icon: null },
  { value: "general", label: "General", icon: MessageCircle },
  { value: "question", label: "Questions", icon: HelpCircle },
  { value: "alert", label: "Alerts", icon: AlertTriangle },
  { value: "event", label: "Events", icon: Calendar },
] as const;

// Demo comments
const demoComments = (names: string[], texts: string[], baseTime: number): Comment[] =>
  names.map((name, i) => ({
    id: `c${baseTime}-${i}`,
    author: name,
    content: texts[i],
    timestamp: new Date(Date.now() - baseTime + i * 60000).toISOString(),
    likes: Math.floor(Math.random() * 5),
    liked: false,
  }));

const DEMO_POSTS: Post[] = [
  {
    id: "1",
    type: "alert",
    content:
      "Water supply will be shut off tomorrow (March 4) from 10 AM to 2 PM for tank cleaning. Please store water accordingly.",
    author: "secretary",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    likes: 12,
    comments: demoComments(
      ["amit_501", "priya_204", "rahul_105"],
      [
        "Thanks for the heads up! Will store extra water tonight.",
        "Again? This is the 3rd time this month 😤",
        "Can we get at least 24 hours advance notice next time?",
      ],
      1000 * 60 * 20
    ),
    liked: false,
    shared: false,
  },
  {
    id: "2",
    type: "general",
    content:
      "Has anyone seen a grey Persian cat near B-block? She's been missing since yesterday evening. Name is Mitthu. Please contact flat B-204 if found. 🐱",
    author: "priya_204",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    likes: 8,
    comments: demoComments(
      ["neha_c302", "sunita_a302", "guard_1", "rahul_105", "priya_204"],
      [
        "I think I saw a grey cat near the garden area around 6pm!",
        "Oh no! I'll keep an eye out. Hope Mitthu comes back soon 🙏",
        "Madam, I'll check CCTV footage from yesterday evening.",
        "Try putting her food bowl outside your flat door. Cats usually come back for food.",
        "Thank you everyone! Guard bhaiya, please do check the CCTV. 🙏",
      ],
      1000 * 60 * 60
    ),
    liked: false,
    shared: false,
  },
  {
    id: "3",
    type: "question",
    content:
      "Can anyone recommend a reliable electrician? Need to fix some wiring issues in my flat. Budget-friendly please!",
    author: "rahul_105",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likes: 3,
    comments: demoComments(
      ["amit_501", "treasurer", "vikram_a105", "sunita_a302"],
      [
        "Try Sharma Electric — 98765 11111. He did my whole flat rewiring last month. Very reasonable.",
        "Society has an empanelled electrician. Contact office for his number.",
        "Avoid the guy from the market. He charged me ₹2000 for changing a switch 😅",
        "+1 for Sharma Electric. He's been working in this society for years.",
      ],
      1000 * 60 * 60 * 3
    ),
    liked: false,
    shared: false,
  },
  {
    id: "4",
    type: "event",
    content:
      "Holi celebration in the society garden this Sunday at 11 AM! Colors, water balloons, and DJ music. Kids activities from 10 AM. Everyone is welcome! 🎨",
    author: "cultural_committee",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    likes: 24,
    comments: demoComments(
      ["priya_204", "neha_c302", "amit_501"],
      [
        "Yay! Can't wait! Will there be organic colors this year?",
        "Kids are so excited! What about the thandai stall? 🥛",
        "Please make sure we have enough dustbins this time. Last year was messy.",
      ],
      1000 * 60 * 60 * 6
    ),
    liked: false,
    shared: false,
  },
  {
    id: "5",
    type: "alert",
    content:
      "Lift in A-block is under maintenance today. Please use the stairs or B-block lift. Sorry for the inconvenience.",
    author: "maintenance",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    likes: 5,
    comments: demoComments(
      ["vikram_a105", "sunita_a302"],
      [
        "How long will this take? Elderly residents need the lift urgently.",
        "Can B-block lift timings be extended till A-block is fixed?",
      ],
      1000 * 60 * 60 * 10
    ),
    liked: false,
    shared: false,
  },
  {
    id: "6",
    type: "general",
    content:
      "Monthly maintenance bill for February is due. Please pay by March 10 to avoid late charges. UPI: society@upi",
    author: "treasurer",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    likes: 6,
    comments: demoComments(
      ["rahul_105", "amit_501", "treasurer"],
      [
        "Can we get a proper breakdown of expenses this month?",
        "Paid! Transaction ID: UPI123456. Please confirm receipt.",
        "@amit_501 Received, thank you! @rahul_105 Expense sheet will be shared on WhatsApp group.",
      ],
      1000 * 60 * 60 * 20
    ),
    liked: false,
    shared: false,
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

  const currentUser = user?.email?.split("@")[0] || "user";

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
      comments: [],
      liked: false,
      shared: false,
    };
    setPosts((prev) => [post, ...prev]);
  };

  const handleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const handleComment = (postId: string, content: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      author: currentUser,
      content,
      timestamp: new Date().toISOString(),
      likes: 0,
      liked: false,
    };
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
      )
    );
  };

  const handleCommentLike = (postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: p.comments.map((c) =>
                c.id === commentId
                  ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
                  : c
              ),
            }
          : p
      )
    );
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
          : p
      )
    );
  };

  const handleShare = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, shared: true } : p))
    );
    // Copy link or native share
    if (navigator.share) {
      const post = posts.find((p) => p.id === id);
      navigator.share({
        title: "MySociety Post",
        text: post?.content.slice(0, 100),
        url: window.location.href,
      });
    }
  };

  const handleDM = (author: string) => {
    window.location.href = `/messages?to=${author}`;
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
            <h1 className="text-lg font-bold text-foreground">
              Community Feed
            </h1>
          </div>
          <a
            href="/messages"
            className="relative rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <Mail size={18} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />
          </a>
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
              <MessageCircle size={32} className="mx-auto mb-2 text-muted" />
              <p className="text-sm text-muted">
                No posts yet. Be the first to share!
              </p>
            </div>
          ) : (
            filtered.map((post) => (
              <FeedPost
                key={post.id}
                post={post}
                currentUser={currentUser}
                onLike={handleLike}
                onComment={handleComment}
                onCommentLike={handleCommentLike}
                onDeleteComment={handleDeleteComment}
                onShare={handleShare}
                onDM={handleDM}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
