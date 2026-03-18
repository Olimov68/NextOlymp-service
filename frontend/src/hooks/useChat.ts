"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface ChatMessage {
  id: number;
  user_id: number;
  username: string;
  photo_url: string;
  content: string;
  type: string;
  role?: string;
  created_at: string;
}

interface UseChatConfig {
  apiUrl: string;
  token: string;
  enabled: boolean;
}

export function useChat(config: UseChatConfig) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Load message history
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${config.apiUrl}/user/chat/messages?limit=50`, {
        headers: { Authorization: `Bearer ${config.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const msgs = data?.data?.messages || [];
        setMessages(msgs.reverse()); // eskisidan yangisiga
        if (data?.data?.meta?.online) {
          setOnlineCount(data.data.meta.online);
        }
      }
    } catch {
      // ignore
    }
  }, [config.apiUrl, config.token]);

  // WebSocket connect
  const connect = useCallback(() => {
    if (!config.enabled || !config.token) return;

    const wsUrl = config.apiUrl
      .replace("https://", "wss://")
      .replace("http://", "ws://");

    const ws = new WebSocket(`${wsUrl}/user/chat/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      loadHistory();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "new_message":
            setMessages((prev) => [...prev, data.payload as ChatMessage]);
            break;
          case "message_deleted":
            setMessages((prev) =>
              prev.filter((m) => m.id !== data.payload?.id)
            );
            break;
          case "online_count":
            setOnlineCount(data.payload?.count || 0);
            break;
          case "chat_status":
            setIsChatOpen(data.payload?.is_open ?? true);
            break;
          case "user_banned":
            // Handle ban notification if needed
            break;
        }
      } catch {
        // parse error
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect with exponential backoff
      if (config.enabled) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [config.enabled, config.token, config.apiUrl, loadHistory]);

  // Send message
  const sendMessage = useCallback(
    (content: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: "message", content })
        );
      }
    },
    []
  );

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    messages,
    isConnected,
    onlineCount,
    isChatOpen,
    sendMessage,
  };
}
