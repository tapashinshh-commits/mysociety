"use client";

import { useState } from "react";
import {
  MessageCircle,
  HelpCircle,
  AlertTriangle,
  Calendar,
  Send,
  X,
  ImagePlus,
} from "lucide-react";

const POST_TYPES = [
  {
    value: "general",
    label: "General",
    icon: MessageCircle,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    value: "question",
    label: "Question",
    icon: HelpCircle,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    value: "alert",
    label: "Alert",
    icon: AlertTriangle,
    color: "text-danger",
    bg: "bg-danger/10",
  },
  {
    value: "event",
    label: "Event",
    icon: Calendar,
    color: "text-success",
    bg: "bg-success/10",
  },
] as const;

type PostType = (typeof POST_TYPES)[number]["value"];

interface CreatePostProps {
  userEmail: string;
  onPost: (post: {
    type: PostType;
    content: string;
    author: string;
  }) => void;
}

export default function CreatePost({ userEmail, onPost }: CreatePostProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PostType>("general");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setPosting(true);
    onPost({
      type,
      content: content.trim(),
      author: userEmail.split("@")[0],
    });
    setContent("");
    setType("general");
    setOpen(false);
    setPosting(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left text-muted transition-colors hover:border-primary/30 hover:bg-surface-hover"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle size={18} className="text-primary" />
        </div>
        <span className="text-sm">Share something with your society...</span>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-surface p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Create Post</h3>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <X size={18} />
        </button>
      </div>

      {/* Post Type Selector */}
      <div className="mb-3 flex gap-2">
        {POST_TYPES.map((pt) => (
          <button
            key={pt.value}
            onClick={() => setType(pt.value)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              type === pt.value
                ? `${pt.bg} ${pt.color}`
                : "text-muted hover:bg-surface-hover"
            }`}
          >
            <pt.icon size={14} />
            {pt.label}
          </button>
        ))}
      </div>

      {/* Content Input */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          type === "question"
            ? "Ask your society a question..."
            : type === "alert"
            ? "What do neighbors need to know?"
            : type === "event"
            ? "Share event details..."
            : "What's happening in your society?"
        }
        rows={3}
        className="mb-3 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        autoFocus
      />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted transition-colors hover:bg-surface-hover hover:text-foreground">
          <ImagePlus size={16} />
          Photo
        </button>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || posting}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          <Send size={14} />
          Post
        </button>
      </div>
    </div>
  );
}
