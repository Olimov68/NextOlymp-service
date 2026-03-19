"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useChat } from "@/hooks/useChat";
import {
  Send,
  Wifi,
  WifiOff,
  Users,
  Loader2,
  MessageCircle,
  AlertTriangle,
  ArrowDown,
  Reply,
  X,
} from "lucide-react";
import type { ChatMessage } from "@/hooks/useChat";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nextolymp.uz/api/v1";

export default function ChatPage() {
  const { token, user } = useAuth();
  const [message, setMessage] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isConnected,
    onlineCount,
    isChatOpen,
    chatStatus,
    hasMore,
    loadingMore,
    cooldown,
    error: chatError,
    sendMessage,
    loadOlderMessages,
  } = useChat({
    apiUrl: API_URL,
    token: token || "",
    enabled: !!token,
  });

  const userId = (user as { id?: number })?.id;

  // Auto-scroll to bottom on new messages (only if near bottom)
  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 150;
  }, []);

  useEffect(() => {
    if (isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isNearBottom]);

  // Scroll position tracking for "scroll to bottom" button
  const handleScroll = useCallback(() => {
    setShowScrollBtn(!isNearBottom());
  }, [isNearBottom]);

  // Infinite scroll - load older messages when sentinel is visible
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadOlderMessages();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadOlderMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || cooldown) return;
    sendMessage(trimmed, replyingTo?.id);
    setMessage("");
    setReplyingTo(null);
    inputRef.current?.focus();
  };

  const scrollToMessage = (msgId: number) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-indigo-500/10");
      setTimeout(() => el.classList.remove("bg-indigo-500/10"), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "hozir";
      if (mins < 60) return `${mins} min oldin`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} soat oldin`;
      return date.toLocaleDateString("uz", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatDateSeparator = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return "Bugun";
      if (date.toDateString() === yesterday.toDateString()) return "Kecha";
      return date.toLocaleDateString("uz", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return "";
    }
  };

  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const curr = new Date(messages[index].created_at).toDateString();
    const prev = new Date(messages[index - 1].created_at).toDateString();
    return curr !== prev;
  };

  const isBanned = chatStatus?.is_banned;
  const maxLen = chatStatus?.max_message_len || 500;
  const canSend = isConnected && isChatOpen && !isBanned && !cooldown && message.trim().length > 0;

  if (!token) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)] text-gray-400">
        <p>Chatga kirish uchun tizimga kiring</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center justify-between rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Global Chat</h1>
            <div className="flex items-center gap-2 text-xs">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-400" />
                  <span className="text-red-400">Ulanmagan</span>
                </>
              )}
              <span className="text-gray-600">•</span>
              <Users className="w-3 h-3 text-gray-400" />
              <span className="text-gray-400">{onlineCount} online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat closed banner */}
      {!isChatOpen && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 text-sm">Chat vaqtincha yopilgan. Admin tomonidan qayta ochiladi.</span>
        </div>
      )}

      {/* Banned banner */}
      {isBanned && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm">
            Siz chatdan bloklangansiz{chatStatus?.ban_reason ? `: ${chatStatus.ban_reason}` : ""}.
          </span>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-gray-950/50"
      >
        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="h-1" />

        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          </div>
        )}

        {!hasMore && messages.length > 0 && (
          <div className="text-center py-2">
            <span className="text-xs text-gray-600">Barcha xabarlar yuklandi</span>
          </div>
        )}

        {messages.length === 0 && !loadingMore && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Chatda hali xabarlar yo&apos;q</p>
            <p className="text-sm mt-1">Birinchi bo&apos;lib yozing!</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMe = msg.user_id === userId;
          const isAdmin = msg.role === "admin" || msg.role === "superadmin";

          return (
            <div key={msg.id} id={`msg-${msg.id}`} className="transition-colors duration-500 rounded-lg">
              {/* Date separator */}
              {shouldShowDateSeparator(index) && (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-gray-800" />
                  <span className="text-xs text-gray-500 font-medium">
                    {formatDateSeparator(msg.created_at)}
                  </span>
                  <div className="flex-1 h-px bg-gray-800" />
                </div>
              )}

              {/* Message */}
              <div className={`group flex gap-2.5 mb-2 ${isMe ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className="flex-shrink-0 mt-1">
                  {msg.photo_url ? (
                    <img
                      src={msg.photo_url}
                      alt={msg.username}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-800"
                    />
                  ) : (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-gray-800 ${
                      isAdmin ? "bg-amber-600" : isMe ? "bg-indigo-600" : "bg-gray-700"
                    }`}>
                      {msg.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                  <div className={`flex items-center gap-2 mb-0.5 ${isMe ? "flex-row-reverse" : ""}`}>
                    <span className={`text-xs font-semibold ${
                      isAdmin ? "text-amber-400" : isMe ? "text-indigo-400" : "text-gray-400"
                    }`}>
                      {msg.username}
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">
                        {msg.role}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-600">{formatTime(msg.created_at)}</span>
                  </div>
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-indigo-600 text-white rounded-tr-md"
                        : isAdmin
                        ? "bg-amber-600/20 text-amber-100 border border-amber-600/30 rounded-tl-md"
                        : "bg-gray-800 text-gray-200 rounded-tl-md"
                    }`}
                  >
                    {/* Reply preview — Telegram style */}
                    {msg.reply_to && (
                      <button
                        onClick={() => scrollToMessage(msg.reply_to!.id)}
                        className={`flex items-start gap-2 w-full mb-2 p-2 rounded-lg text-left transition-colors ${
                          isMe
                            ? "bg-indigo-500/30 hover:bg-indigo-500/40"
                            : isAdmin
                            ? "bg-amber-500/10 hover:bg-amber-500/20"
                            : "bg-gray-700/50 hover:bg-gray-700/70"
                        }`}
                      >
                        <div className={`w-0.5 rounded-full self-stretch flex-shrink-0 ${
                          isMe ? "bg-white/60" : "bg-indigo-400"
                        }`} />
                        <div className="min-w-0 flex-1">
                          <span className={`text-[11px] font-bold block ${
                            isMe ? "text-white/80" : "text-indigo-400"
                          }`}>
                            {msg.reply_to.username}
                          </span>
                          <span className={`text-[11px] block truncate ${
                            isMe ? "text-white/60" : "text-gray-400"
                          }`}>
                            {msg.reply_to.content}
                          </span>
                        </div>
                      </button>
                    )}
                    {msg.content}
                  </div>
                </div>

                {/* Reply button — appears on hover */}
                <button
                  onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }}
                  className={`self-center opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-gray-700/50 transition-all ${
                    isMe ? "order-first" : ""
                  }`}
                  title="Javob berish"
                >
                  <Reply className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <div className="relative">
          <button
            onClick={scrollToBottom}
            className="absolute -top-12 right-4 w-10 h-10 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all shadow-lg z-10"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-t border-gray-800 px-4 py-3 rounded-b-xl">
        {/* Profanity error */}
        {chatError && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400">{chatError}</span>
          </div>
        )}
        {/* Reply banner */}
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <div className="w-0.5 h-8 bg-indigo-500 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-indigo-400">{replyingTo.username}</span>
              <p className="text-xs text-gray-400 truncate">{replyingTo.content}</p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, maxLen))}
            onKeyDown={handleKeyDown}
            placeholder={
              isBanned
                ? "Siz bloklangansiz"
                : !isChatOpen
                ? "Chat yopilgan"
                : cooldown
                ? "Kutib turing..."
                : "Xabar yozing..."
            }
            disabled={isBanned || !isChatOpen}
            maxLength={maxLen}
            className="flex-1 bg-gray-800/80 text-white px-4 py-2.5 rounded-xl border border-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-sm placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {/* Status bar */}
        <div className="flex items-center justify-between mt-1.5 px-1">
          <div className="flex items-center gap-2">
            {cooldown && (
              <span className="text-[10px] text-yellow-400">Cooldown...</span>
            )}
          </div>
          <span className={`text-[10px] ${message.length > maxLen * 0.9 ? "text-red-400" : "text-gray-600"}`}>
            {message.length}/{maxLen}
          </span>
        </div>
      </div>
    </div>
  );
}
