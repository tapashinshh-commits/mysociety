"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
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
import type { Post as DBPost, Comment as DBComment } from "@/types/database";

const FILTERS = [
  { value: "all", label: "All", icon: null },
  { value: "general", label: "General", icon: MessageCircle },
  { value: "question", label: "Questions", icon: HelpCircle },
  { value: "alert", label: "Alerts", icon: AlertTriangle },
  { value: "event", label: "Events", icon: Calendar },
] as const;

type FilterType = (typeof FILTERS)[number]["value"];

export default function FeedPage() {
  const { user, profile, loading, supabase } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [fetching, setFetching] = useState(true);

  // Fetch all posts for the society along with like status and comments
  const fetchPosts = useCallback(async () => {
    if (!profile?.society_id || !user) return;

    setFetching(true);

    // Fetch posts with author info
    const { data: rawPosts, error: postsError } = await supabase
      .from("posts")
      .select("*, author:profiles(full_name, avatar_url)")
      .eq("society_id", profile.society_id)
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      setFetching(false);
      return;
    }

    if (!rawPosts || rawPosts.length === 0) {
      setPosts([]);
      setFetching(false);
      return;
    }

    // Fetch which posts the current user has liked
    const postIds = rawPosts.map((p: DBPost) => p.id);
    const { data: likedPosts } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);

    const likedPostIds = new Set(
      (likedPosts || []).map((l: { post_id: string }) => l.post_id)
    );

    // Fetch comments for all posts with author info
    const { data: rawComments } = await supabase
      .from("comments")
      .select("*, author:profiles(full_name, avatar_url)")
      .in("post_id", postIds)
      .order("created_at", { ascending: true });

    // Fetch which comments the current user has liked
    const commentIds = (rawComments || []).map((c: DBComment) => c.id);
    let likedCommentIds = new Set<string>();
    if (commentIds.length > 0) {
      const { data: likedComments } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .in("comment_id", commentIds);

      likedCommentIds = new Set(
        (likedComments || []).map(
          (l: { comment_id: string }) => l.comment_id
        )
      );
    }

    // Group comments by post_id
    const commentsByPost = new Map<string, Comment[]>();
    for (const c of rawComments || []) {
      const comment: Comment = {
        ...c,
        liked: likedCommentIds.has(c.id),
      };
      const existing = commentsByPost.get(c.post_id) || [];
      existing.push(comment);
      commentsByPost.set(c.post_id, existing);
    }

    // Assemble final posts
    const assembled: Post[] = rawPosts.map((p: DBPost) => ({
      ...p,
      comments: commentsByPost.get(p.id) || [],
      liked: likedPostIds.has(p.id),
      shared: false,
    }));

    setPosts(assembled);
    setFetching(false);
  }, [profile?.society_id, user, supabase]);

  // Initial fetch
  useEffect(() => {
    if (!loading && profile?.society_id && user) {
      fetchPosts();
    } else if (!loading) {
      setFetching(false);
    }
  }, [loading, profile?.society_id, user, fetchPosts]);

  // Real-time subscription for new posts
  useEffect(() => {
    if (!profile?.society_id || !user) return;

    const channel = supabase
      .channel("feed-posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `society_id=eq.${profile.society_id}`,
        },
        async (payload) => {
          const newPostRaw = payload.new as DBPost;

          // Don't add duplicates
          setPosts((prev) => {
            if (prev.some((p) => p.id === newPostRaw.id)) return prev;
            return prev; // will be replaced below
          });

          // Fetch the full post with author info
          const { data: fullPost } = await supabase
            .from("posts")
            .select("*, author:profiles(full_name, avatar_url)")
            .eq("id", newPostRaw.id)
            .single();

          if (fullPost) {
            const newPost: Post = {
              ...fullPost,
              comments: [],
              liked: false,
              shared: false,
            };
            setPosts((prev) => {
              if (prev.some((p) => p.id === newPost.id)) return prev;
              return [newPost, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.society_id, user, supabase]);

  // Handler: post created callback (refetch is optional since realtime will pick it up,
  // but we refetch for immediate feedback in case realtime is delayed)
  const handlePostCreated = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handler: toggle like on a post
  const handleLike = useCallback(
    async (postId: string) => {
      if (!user) return;

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                liked: !p.liked,
                likes_count: p.liked
                  ? p.likes_count - 1
                  : p.likes_count + 1,
              }
            : p
        )
      );

      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (post.liked) {
        // Unlike: delete the row
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error unliking post:", error);
          // Revert on error
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? { ...p, liked: true, likes_count: p.likes_count + 1 }
                : p
            )
          );
        }
      } else {
        // Like: insert the row
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });

        if (error) {
          console.error("Error liking post:", error);
          // Revert on error
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? { ...p, liked: false, likes_count: p.likes_count - 1 }
                : p
            )
          );
        }
      }
    },
    [user, posts, supabase]
  );

  // Handler: add a comment to a post
  const handleComment = useCallback(
    async (postId: string, content: string) => {
      if (!user || !profile) return;

      // Optimistic update
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        post_id: postId,
        author_id: user.id,
        content,
        likes_count: 0,
        created_at: new Date().toISOString(),
        author: {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        },
        liked: false,
      };

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: [...p.comments, optimisticComment],
                comments_count: p.comments_count + 1,
              }
            : p
        )
      );

      const { data: inserted, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          author_id: user.id,
          content,
        })
        .select("*, author:profiles(full_name, avatar_url)")
        .single();

      if (error) {
        console.error("Error adding comment:", error);
        // Revert optimistic update
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: p.comments.filter(
                    (c) => c.id !== optimisticComment.id
                  ),
                  comments_count: p.comments_count - 1,
                }
              : p
          )
        );
        return;
      }

      // Replace optimistic comment with real one
      if (inserted) {
        const realComment: Comment = {
          ...inserted,
          liked: false,
        };
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: p.comments.map((c) =>
                    c.id === optimisticComment.id ? realComment : c
                  ),
                }
              : p
          )
        );
      }
    },
    [user, profile, supabase]
  );

  // Handler: toggle like on a comment
  const handleCommentLike = useCallback(
    async (postId: string, commentId: string) => {
      if (!user) return;

      // Find current state
      const post = posts.find((p) => p.id === postId);
      const comment = post?.comments.find((c) => c.id === commentId);
      if (!comment) return;

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: p.comments.map((c) =>
                  c.id === commentId
                    ? {
                        ...c,
                        liked: !c.liked,
                        likes_count: c.liked
                          ? c.likes_count - 1
                          : c.likes_count + 1,
                      }
                    : c
                ),
              }
            : p
        )
      );

      if (comment.liked) {
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error unliking comment:", error);
          // Revert
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    comments: p.comments.map((c) =>
                      c.id === commentId
                        ? {
                            ...c,
                            liked: true,
                            likes_count: c.likes_count + 1,
                          }
                        : c
                    ),
                  }
                : p
            )
          );
        }
      } else {
        const { error } = await supabase
          .from("comment_likes")
          .insert({ comment_id: commentId, user_id: user.id });

        if (error) {
          console.error("Error liking comment:", error);
          // Revert
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    comments: p.comments.map((c) =>
                      c.id === commentId
                        ? {
                            ...c,
                            liked: false,
                            likes_count: c.likes_count - 1,
                          }
                        : c
                    ),
                  }
                : p
            )
          );
        }
      }
    },
    [user, posts, supabase]
  );

  // Handler: delete a comment
  const handleDeleteComment = useCallback(
    async (postId: string, commentId: string) => {
      if (!user) return;

      // Store for potential revert
      const post = posts.find((p) => p.id === postId);
      const deletedComment = post?.comments.find((c) => c.id === commentId);

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: p.comments.filter((c) => c.id !== commentId),
                comments_count: Math.max(0, p.comments_count - 1),
              }
            : p
        )
      );

      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("author_id", user.id);

      if (error) {
        console.error("Error deleting comment:", error);
        // Revert
        if (deletedComment) {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    comments: [...p.comments, deletedComment],
                    comments_count: p.comments_count + 1,
                  }
                : p
            )
          );
        }
      }
    },
    [user, posts, supabase]
  );

  // Handler: share a post
  const handleShare = useCallback(
    (id: string) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, shared: true } : p))
      );
      if (navigator.share) {
        const post = posts.find((p) => p.id === id);
        navigator.share({
          title: "MySociety Post",
          text: post?.content.slice(0, 100),
          url: window.location.href,
        });
      }
    },
    [posts]
  );

  // Handler: DM an author
  const handleDM = useCallback((authorId: string) => {
    window.location.href = `/messages?to=${authorId}`;
  }, []);

  const filtered =
    filter === "all" ? posts : posts.filter((p) => p.type === filter);

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
        <div className="rounded-xl border border-border bg-surface p-8 text-center max-w-sm">
          <MessageCircle size={32} className="mx-auto mb-3 text-muted" />
          <h2 className="text-lg font-bold text-foreground mb-2">
            Set Up Your Profile
          </h2>
          <p className="text-sm text-muted mb-4">
            You need to join a society before you can access the community feed.
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
            userId={user.id}
            societyId={profile.society_id}
            supabase={supabase}
            onPostCreated={handlePostCreated}
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
                userId={user.id}
                userFullName={profile.full_name || "You"}
                userAvatarUrl={profile.avatar_url}
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
