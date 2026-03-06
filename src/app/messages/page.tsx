"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import type { Message, Conversation } from "@/types/database";
import {
  ArrowLeft,
  Send,
  Search,
  MessageCircle,
  Check,
  CheckCheck,
} from "lucide-react";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function MessagesPage() {
  const { user, profile, loading, supabase } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState<string>("");
  const [activeChatAvatar, setActiveChatAvatar] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<string | null>(null);

  // Keep ref in sync so real-time callback can read the latest value
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user || !supabase || !profile?.society_id) return;
    const { data, error } = await supabase.rpc("get_conversations", {
      p_user_id: user.id,
    });
    if (!error && data) {
      setConversations(data as Conversation[]);
    }
    setLoadingConversations(false);
  }, [user, supabase, profile?.society_id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Handle ?to=userId query param (from feed DM button)
  useEffect(() => {
    if (!user || !supabase || !profile?.society_id) return;

    const params = new URLSearchParams(window.location.search);
    const toUserId = params.get("to");
    if (toUserId && toUserId !== user.id) {
      openConversation(toUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, supabase, profile?.society_id]);

  // Real-time subscription for incoming messages
  useEffect(() => {
    if (!user || !supabase) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload: { new: Message }) => {
          const newMsg = payload.new as Message;

          // If this message is from the currently open conversation, add it to the chat
          if (activeChatRef.current === newMsg.sender_id) {
            setMessages((prev) => [...prev, newMsg]);
            // Mark it as read immediately
            await supabase
              .from("messages")
              .update({ read: true })
              .eq("id", newMsg.id);
          }

          // Refresh conversation list to update last message / unread counts
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, loadConversations]);

  // Open a conversation: load messages and mark unread as read
  const openConversation = async (partnerId: string) => {
    if (!user || !supabase) return;

    setActiveChat(partnerId);
    setLoadingMessages(true);

    // Look up partner name/avatar from conversations list first
    const existing = conversations.find((c) => c.other_user_id === partnerId);
    if (existing) {
      setActiveChatName(existing.other_user_name || partnerId);
      setActiveChatAvatar(existing.other_user_avatar);
    } else {
      // Fetch profile for the partner (e.g., when coming from ?to= and conversation doesn't exist yet)
      const { data: partnerProfile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", partnerId)
        .single();
      setActiveChatName(partnerProfile?.full_name || "User");
      setActiveChatAvatar(partnerProfile?.avatar_url || null);
    }

    // Load messages between the two users
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    setMessages((msgs as Message[]) || []);
    setLoadingMessages(false);

    // Mark unread messages from this partner as read
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", partnerId)
      .eq("receiver_id", user.id)
      .eq("read", false);

    // Update local conversation unread count
    setConversations((prev) =>
      prev.map((c) =>
        c.other_user_id === partnerId ? { ...c, unread_count: 0 } : c
      )
    );
  };

  // Send a message
  const handleSend = async () => {
    if (!newMessage.trim() || !activeChat || !user || !supabase || !profile?.society_id)
      return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Optimistic: add to local messages immediately
    const optimisticMsg: Message = {
      id: crypto.randomUUID(),
      society_id: profile.society_id,
      sender_id: user.id,
      receiver_id: activeChat,
      content,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Insert into database
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        society_id: profile.society_id,
        sender_id: user.id,
        receiver_id: activeChat,
        content,
      })
      .select()
      .single();

    if (!error && inserted) {
      // Replace optimistic message with the real one
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? (inserted as Message) : m))
      );
    }

    setSending(false);

    // Refresh conversations to update last message
    loadConversations();
  };

  const filteredConversations = conversations.filter((c) =>
    (c.other_user_name || "").toLowerCase().includes(search.toLowerCase())
  );

  // Loading state
  if (loading) {
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <MessageCircle size={48} className="mb-4 text-muted" />
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          Set up your profile first
        </h2>
        <p className="mb-6 text-center text-sm text-muted">
          You need to join a society before you can send messages.
        </p>
        <a
          href="/dashboard"
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Go to Dashboard
        </a>
      </div>
    );
  }

  // Chat view
  if (activeChat) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Chat Header */}
        <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
            <button
              onClick={() => {
                setActiveChat(null);
                setMessages([]);
                loadConversations();
              }}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                {activeChatAvatar ? (
                  <img
                    src={activeChatAvatar}
                    alt={activeChatName}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {activeChatName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {activeChatName}
                </h2>
              </div>
            </div>
          </div>
        </nav>

        {/* Messages */}
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-end px-4 py-4">
          <div className="space-y-3">
            {loadingMessages ? (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : messages.length === 0 ? (
              <div className="py-12 text-center">
                <MessageCircle size={32} className="mx-auto mb-2 text-muted" />
                <p className="text-sm text-muted">
                  Start a conversation with {activeChatName}
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      msg.sender_id === user.id
                        ? "rounded-br-md bg-primary text-white"
                        : "rounded-bl-md bg-surface border border-border text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <div
                      className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                        msg.sender_id === user.id ? "text-white/60" : "text-muted"
                      }`}
                    >
                      {timeAgo(msg.created_at)}
                      {msg.sender_id === user.id &&
                        (msg.read ? (
                          <CheckCheck size={12} />
                        ) : (
                          <Check size={12} />
                        ))}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-30"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversations list
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
          <h1 className="text-lg font-bold text-foreground">Messages</h1>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Conversation List */}
        <div className="space-y-1">
          {loadingConversations ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <MessageCircle size={32} className="mx-auto mb-2 text-muted" />
              <p className="text-sm text-muted">No conversations yet.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.other_user_id}
                onClick={() => openConversation(conv.other_user_id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-surface"
              >
                {/* Avatar */}
                <div className="relative">
                  {conv.other_user_avatar ? (
                    <img
                      src={conv.other_user_avatar}
                      alt={conv.other_user_name || "User"}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {(conv.other_user_name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${conv.unread_count > 0 ? "font-bold text-foreground" : "font-medium text-foreground"}`}
                    >
                      {conv.other_user_name || "User"}
                    </span>
                    <span className="text-[10px] text-muted">
                      {timeAgo(conv.last_time)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={`truncate text-xs ${conv.unread_count > 0 ? "font-medium text-foreground" : "text-muted"}`}
                    >
                      {conv.last_message}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
