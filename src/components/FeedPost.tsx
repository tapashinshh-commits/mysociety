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
  Share2,
  Send,
  Trash2,
  Mail,
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

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  liked: boolean;
}

export interface Post {
  id: string;
  type: "general" | "question" | "alert" | "event";
  content: string;
  author: string;
  authorAvatar?: string;
  timestamp: string;
  likes: number;
  comments: Comment[];
  liked: boolean;
  shared: boolean;
}

interface FeedPostProps {
  post: Post;
  currentUser: string;
  onLike: (id: string) => void;
  onComment: (postId: string, content: string) => void;
  onCommentLike: (postId: string, commentId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onShare: (id: string) => void;
  onDM: (author: string) => void;
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

export default function FeedPost({
  post,
  currentUser,
  onLike,
  onComment,
  onCommentLike,
  onDeleteComment,
  onShare,
  onDM,
}: FeedPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const config = TYPE_CONFIG[post.type];

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onComment(post.id, commentText.trim());
    setCommentText("");
  };

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
            <span className="text-xs text-muted">
              {timeAgo(post.timestamp)}
            </span>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-1 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <MoreHorizontal size={16} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 z-10 w-40 rounded-lg border border-border bg-surface py-1 shadow-lg">
              <button
                onClick={() => {
                  onDM(post.author);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface-hover"
              >
                <Mail size={14} />
                Message {post.author}
              </button>
              <button
                onClick={() => {
                  onShare(post.id);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface-hover"
              >
                <Share2 size={14} />
                Share Post
              </button>
            </div>
          )}
        </div>
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
      {(post.likes > 0 || post.comments.length > 0) && (
        <div className="flex items-center gap-4 px-4 pb-2 text-xs text-muted">
          {post.likes > 0 && (
            <span className="flex items-center gap-1">
              <Heart size={12} className="fill-primary text-primary" />
              {post.likes}
            </span>
          )}
          {post.comments.length > 0 && (
            <button
              onClick={() => setShowComments(true)}
              className="hover:text-foreground"
            >
              {post.comments.length} comment
              {post.comments.length !== 1 ? "s" : ""}
            </button>
          )}
          {post.shared && (
            <span className="flex items-center gap-1">
              <Share2 size={12} />
              Shared
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
          {post.liked ? (
            <Heart size={16} className="fill-primary" />
          ) : (
            <ThumbsUp size={16} />
          )}
          {post.liked ? "Liked" : "Like"}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex flex-1 items-center justify-center gap-1.5 border-l border-border py-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <MessageSquare size={16} />
          Comment
        </button>
        <button
          onClick={() => onShare(post.id)}
          className={`flex flex-1 items-center justify-center gap-1.5 border-l border-border py-2.5 text-xs font-medium transition-colors ${
            post.shared
              ? "text-success"
              : "text-muted hover:bg-surface-hover hover:text-foreground"
          }`}
        >
          <Share2 size={16} />
          Share
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-border">
          {/* Existing Comments */}
          {post.comments.length > 0 && (
            <div className="max-h-64 space-y-0 overflow-y-auto">
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-2.5 border-b border-border/50 px-4 py-3 last:border-b-0"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {comment.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="rounded-lg bg-surface-hover px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {comment.author}
                        </span>
                        <span className="text-[10px] text-muted">
                          {timeAgo(comment.timestamp)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-foreground">
                        {comment.content}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-3 pl-1">
                      <button
                        onClick={() => onCommentLike(post.id, comment.id)}
                        className={`flex items-center gap-1 text-[10px] font-medium ${
                          comment.liked
                            ? "text-primary"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        <ThumbsUp size={10} />
                        {comment.likes > 0 && comment.likes}
                        {comment.liked ? " Liked" : " Like"}
                      </button>
                      {comment.author === currentUser && (
                        <button
                          onClick={() =>
                            onDeleteComment(post.id, comment.id)
                          }
                          className="flex items-center gap-1 text-[10px] text-muted hover:text-danger"
                        >
                          <Trash2 size={10} />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment Input */}
          <div className="flex items-center gap-2 p-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
              placeholder="Write a comment..."
              className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-30"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
