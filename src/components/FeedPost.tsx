"use client";

import { useState } from "react";
import {
  MessageCircle,
  HelpCircle,
  AlertTriangle,
  Calendar,
  ThumbsUp,
  Heart,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";

const TYPE_CONFIG = {
  general: {
    icon: MessageCircle,
    label: "General",
    color: "text-primary",
    bg: "bg-primary/10",
    badge: "bg-primary/10 text-primary",
  },
  question: {
    icon: HelpCircle,
    label: "Question",
    color: "text-accent",
    bg: "bg-accent/10",
    badge: "bg-accent/10 text-accent",
  },
  alert: {
    icon: AlertTriangle,
    label: "Alert",
    color: "text-danger",
    bg: "bg-danger/10",
    badge: "bg-danger/10 text-danger",
  },
  event: {
    icon: Calendar,
    label: "Event",
    color: "text-success",
    bg: "bg-success/10",
    badge: "bg-success/10 text-success",
  },
} as const;

export interface Post {
  id: string;
  type: "general" | "question" | "alert" | "event";
  content: string;
  author: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked: boolean;
}

interface FeedPostProps {
  post: Post;
  onLike: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function FeedPost({ post, onLike }: FeedPostProps) {
  const [showComments, setShowComments] = useState(false);
  const config = TYPE_CONFIG[post.type];
  const Icon = config.icon;

  return (
    <article className="rounded-xl border border-border bg-surface transition-colors hover:border-border/80">
      {/* Post Header */}
      <div className="flex items-start justify-between p-4 pb-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {post.author.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {post.author}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config.badge}`}
              >
                {config.label}
              </span>
            </div>
            <span className="text-xs text-muted">{timeAgo(post.timestamp)}</span>
          </div>
        </div>
        <button className="rounded-lg p-1 text-muted transition-colors hover:bg-surface-hover hover:text-foreground">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {post.type === "alert" && (
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-danger">
            <AlertTriangle size={14} />
            Important Alert
          </div>
        )}
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Stats */}
      {(post.likes > 0 || post.comments > 0) && (
        <div className="flex items-center gap-4 px-4 pb-2 text-xs text-muted">
          {post.likes > 0 && (
            <span className="flex items-center gap-1">
              <ThumbsUp size={12} className="text-primary" />
              {post.likes}
            </span>
          )}
          {post.comments > 0 && (
            <span>
              {post.comments} comment{post.comments !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex border-t border-border">
        <button
          onClick={() => onLike(post.id)}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
            post.liked
              ? "text-primary"
              : "text-muted hover:bg-surface-hover hover:text-foreground"
          }`}
        >
          {post.liked ? <Heart size={16} className="fill-primary" /> : <ThumbsUp size={16} />}
          {post.liked ? "Liked" : "Like"}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex flex-1 items-center justify-center gap-1.5 border-l border-border py-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <MessageSquare size={16} />
          Comment
        </button>
      </div>

      {/* Comment Input (collapsed for now) */}
      {showComments && (
        <div className="border-t border-border p-3">
          <input
            type="text"
            placeholder="Write a comment..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
    </article>
  );
}
