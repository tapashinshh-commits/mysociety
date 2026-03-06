"use client";

import { useState, useRef } from "react";
import {
  MessageCircle,
  HelpCircle,
  AlertTriangle,
  Calendar,
  Send,
  X,
  ImagePlus,
  Image as ImageIcon,
} from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

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
  userId: string;
  societyId: string;
  supabase: SupabaseClient;
  onPostCreated: () => void;
}

export default function CreatePost({
  userId,
  societyId,
  supabase,
  onPostCreated,
}: CreatePostProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PostType>("general");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return;
    setPosting(true);

    try {
      let imageUrl: string | null = null;

      // Upload image if present
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const filePath = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error("Image upload failed:", uploadError);
          setPosting(false);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("post-images").getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Insert the post
      const { error: insertError } = await supabase.from("posts").insert({
        society_id: societyId,
        author_id: userId,
        type,
        content: content.trim(),
        image_url: imageUrl,
      });

      if (insertError) {
        console.error("Post creation failed:", insertError);
        setPosting(false);
        return;
      }

      // Reset form
      setContent("");
      setType("general");
      setImagePreview(null);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setOpen(false);
      onPostCreated();
    } catch (err) {
      console.error("Unexpected error creating post:", err);
    } finally {
      setPosting(false);
    }
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
          onClick={() => {
            setOpen(false);
            removeImage();
          }}
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

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative mb-3">
          <img
            src={imagePreview}
            alt="Upload preview"
            className="w-full max-h-64 rounded-lg border border-border object-cover"
          />
          <button
            onClick={removeImage}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/80 text-background shadow-md transition-colors hover:bg-foreground"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              imagePreview
                ? "text-primary bg-primary/10"
                : "text-muted hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            <ImagePlus size={16} />
            Photo
          </button>
          <button
            onClick={() => {
              fileInputRef.current?.setAttribute("capture", "user");
              fileInputRef.current?.click();
              // Reset capture for next time
              setTimeout(() => {
                fileInputRef.current?.setAttribute("capture", "environment");
              }, 100);
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <ImageIcon size={16} />
            Camera
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={(!content.trim() && !imageFile) || posting}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          <Send size={14} />
          {posting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
