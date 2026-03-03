"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Send,
  Search,
  MessageCircle,
  Check,
  CheckCheck,
  Circle,
} from "lucide-react";

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  user: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online: boolean;
}

const DEMO_CONVERSATIONS: Conversation[] = [
  {
    user: "priya_204",
    lastMessage: "Thank you for the electrician reference! 🙏",
    lastTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unread: 2,
    online: true,
  },
  {
    user: "secretary",
    lastMessage: "Water tank cleaning confirmed for tomorrow.",
    lastTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unread: 0,
    online: true,
  },
  {
    user: "rahul_105",
    lastMessage: "Bhai, Sharma electrician ka number de do please",
    lastTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unread: 1,
    online: false,
  },
  {
    user: "amit_501",
    lastMessage: "Parking ki problem solve ho gayi?",
    lastTime: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    unread: 0,
    online: false,
  },
  {
    user: "guard_1",
    lastMessage: "Sir, delivery boy aaya hai gate pe",
    lastTime: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    unread: 0,
    online: true,
  },
  {
    user: "neha_c302",
    lastMessage: "Holi party ka plan finalize hua?",
    lastTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unread: 0,
    online: false,
  },
];

const DEMO_MESSAGES: Record<string, Message[]> = {
  priya_204: [
    {
      id: "m1",
      from: "priya_204",
      to: "me",
      content: "Hi! You mentioned an electrician on the feed?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      read: true,
    },
    {
      id: "m2",
      from: "me",
      to: "priya_204",
      content: "Yes! Sharma Electric — 98765 11111. He's very good and reasonable.",
      timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      read: true,
    },
    {
      id: "m3",
      from: "priya_204",
      to: "me",
      content: "What did he charge you approximately?",
      timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      read: true,
    },
    {
      id: "m4",
      from: "me",
      to: "priya_204",
      content: "Around ₹500 for switch replacement, ₹2000 for full room rewiring. Very fair prices.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: true,
    },
    {
      id: "m5",
      from: "priya_204",
      to: "me",
      content: "Thank you for the electrician reference! 🙏",
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      read: false,
    },
    {
      id: "m6",
      from: "priya_204",
      to: "me",
      content: "Called him, he's coming tomorrow morning!",
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      read: false,
    },
  ],
  rahul_105: [
    {
      id: "m7",
      from: "rahul_105",
      to: "me",
      content: "Bhai, Sharma electrician ka number de do please",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      read: false,
    },
  ],
  secretary: [
    {
      id: "m8",
      from: "me",
      to: "secretary",
      content: "Tomorrow's water shutdown — is it the full society or only B-block?",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      read: true,
    },
    {
      id: "m9",
      from: "secretary",
      to: "me",
      content: "Water tank cleaning confirmed for tomorrow. Full society, 10 AM - 2 PM.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: true,
    },
  ],
};

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>(DEMO_CONVERSATIONS);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(DEMO_MESSAGES);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");

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

  // Check if URL has ?to= param for DM from feed
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get("to");
    if (to) {
      setActiveChat(to);
      // Add conversation if not exists
      if (!conversations.find((c) => c.user === to)) {
        setConversations((prev) => [
          {
            user: to,
            lastMessage: "",
            lastTime: new Date().toISOString(),
            unread: 0,
            online: false,
          },
          ...prev,
        ]);
      }
    }
  }, []);

  const handleSend = () => {
    if (!newMessage.trim() || !activeChat) return;
    const msg: Message = {
      id: Date.now().toString(),
      from: "me",
      to: activeChat,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), msg],
    }));

    // Update conversation list
    setConversations((prev) =>
      prev.map((c) =>
        c.user === activeChat
          ? { ...c, lastMessage: msg.content, lastTime: msg.timestamp }
          : c
      )
    );

    setNewMessage("");

    // Simulate typing/reply after 2 seconds
    setTimeout(() => {
      const replies = [
        "Ok, noted 👍",
        "Thanks for letting me know!",
        "Accha theek hai",
        "Will check and get back to you",
        "Haan bilkul!",
      ];
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        from: activeChat,
        to: "me",
        content: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toISOString(),
        read: false,
      };
      setMessages((prev) => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), reply],
      }));
      setConversations((prev) =>
        prev.map((c) =>
          c.user === activeChat
            ? { ...c, lastMessage: reply.content, lastTime: reply.timestamp, unread: c.unread + 1 }
            : c
        )
      );
    }, 2000);
  };

  const filteredConversations = conversations.filter((c) =>
    c.user.toLowerCase().includes(search.toLowerCase())
  );

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

  // Chat view
  if (activeChat) {
    const chatMessages = messages[activeChat] || [];
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Chat Header */}
        <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
            <button
              onClick={() => setActiveChat(null)}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {activeChat.charAt(0).toUpperCase()}
                </div>
                {conversations.find((c) => c.user === activeChat)?.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-success" />
                )}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {activeChat}
                </h2>
                <p className="text-[10px] text-muted">
                  {conversations.find((c) => c.user === activeChat)?.online
                    ? "Online"
                    : "Offline"}
                </p>
              </div>
            </div>
          </div>
        </nav>

        {/* Messages */}
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-end px-4 py-4">
          <div className="space-y-3">
            {chatMessages.length === 0 && (
              <div className="py-12 text-center">
                <MessageCircle size={32} className="mx-auto mb-2 text-muted" />
                <p className="text-sm text-muted">
                  Start a conversation with {activeChat}
                </p>
              </div>
            )}
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.from === "me"
                      ? "rounded-br-md bg-primary text-white"
                      : "rounded-bl-md bg-surface border border-border text-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                      msg.from === "me" ? "text-white/60" : "text-muted"
                    }`}
                  >
                    {timeAgo(msg.timestamp)}
                    {msg.from === "me" && (
                      msg.read ? (
                        <CheckCheck size={12} />
                      ) : (
                        <Check size={12} />
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
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
          {filteredConversations.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <MessageCircle size={32} className="mx-auto mb-2 text-muted" />
              <p className="text-sm text-muted">No conversations yet.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.user}
                onClick={() => {
                  setActiveChat(conv.user);
                  // Mark as read
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.user === conv.user ? { ...c, unread: 0 } : c
                    )
                  );
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-surface"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {conv.user.charAt(0).toUpperCase()}
                  </div>
                  {conv.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-success" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${conv.unread > 0 ? "font-bold text-foreground" : "font-medium text-foreground"}`}
                    >
                      {conv.user}
                    </span>
                    <span className="text-[10px] text-muted">
                      {timeAgo(conv.lastTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={`truncate text-xs ${conv.unread > 0 ? "font-medium text-foreground" : "text-muted"}`}
                    >
                      {conv.lastMessage}
                    </p>
                    {conv.unread > 0 && (
                      <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                        {conv.unread}
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
