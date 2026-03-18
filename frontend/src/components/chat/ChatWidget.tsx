"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useChat, ChatMessage } from "@/hooks/useChat";
import {
  MessageCircle,
  X,
  Send,
  Wifi,
  WifiOff,
  Users,
  Minimize2,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nextolymp.uz/api/v1";

export function ChatWidget() {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isConnected, onlineCount, isChatOpen, sendMessage } = useChat({
    apiUrl: API_URL,
    token: token || "",
    enabled: !!token,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setMessage("");
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
      return date.toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  if (!token) return null;

  return (
    <>
      {/* Chat bubble button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-500 transition-all duration-300 flex items-center justify-center hover:scale-110"
        >
          <MessageCircle className="w-6 h-6" />
          {onlineCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {onlineCount > 99 ? "99+" : onlineCount}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-white font-semibold text-sm">Umumiy Chat</h3>
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
                  <span className="text-gray-500">|</span>
                  <Users className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-400">{onlineCount}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {!isChatOpen && (
              <div className="text-center py-4">
                <p className="text-yellow-400 text-sm">Chat vaqtincha yopilgan</p>
              </div>
            )}

            {messages.length === 0 && isChatOpen && (
              <div className="text-center py-8">
                <MessageCircle className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Hali xabarlar yo&apos;q</p>
              </div>
            )}

            {messages.map((msg) => {
              const isMe = msg.user_id === (user as { id?: number })?.id;
              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {msg.photo_url ? (
                      <img
                        src={msg.photo_url}
                        alt={msg.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {msg.username?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold ${isMe ? "text-indigo-400" : "text-gray-400"}`}>
                        {msg.username}
                      </span>
                      {msg.role === "admin" && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                          ADMIN
                        </span>
                      )}
                      <span className="text-[10px] text-gray-600">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                    <div
                      className={`px-3 py-2 rounded-xl text-sm ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-tr-sm"
                          : "bg-gray-800 text-gray-200 rounded-tl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {isChatOpen && (
            <div className="px-4 py-3 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Xabar yozing..."
                  maxLength={500}
                  className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm placeholder-gray-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || !isConnected}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
