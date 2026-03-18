"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import {
  listDiscussionMessages,
  createDiscussionMessage,
  deleteDiscussionMessage,
  getDiscussionState,
} from "@/lib/user-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessagesSquare, Send, Trash2, Reply, Loader2,
  AlertCircle, UserCircle, ChevronLeft, ChevronRight, ShieldAlert,
} from "lucide-react";

interface DiscussionMessage {
  id: number;
  user_id: number;
  username: string;
  display_name: string;
  user_avatar?: string;
  message: string;
  reply_to_id?: number;
  reply_to?: { id: number; username: string; display_name: string; message: string };
  status: string;
  is_edited: boolean;
  created_at: string;
}

interface DiscussionState {
  is_muted: boolean;
  muted_until?: string;
  is_blocked: boolean;
}

export default function DiscussionPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<DiscussionMessage | null>(null);
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: stateData } = useQuery({
    queryKey: ["discussion-state"],
    queryFn: getDiscussionState,
  });
  const myState: DiscussionState = stateData || { is_muted: false, is_blocked: false };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["discussion-messages", page],
    queryFn: () => listDiscussionMessages({ page, page_size: 50 }),
  });

  const messages: DiscussionMessage[] = data?.items || [];
  const pagination = data?.pagination;

  const sendMutation = useMutation({
    mutationFn: createDiscussionMessage,
    onSuccess: () => {
      setMessage("");
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ["discussion-messages"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDiscussionMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussion-messages"] });
    },
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMutation.mutate({
      message: trimmed,
      reply_to_id: replyTo?.id,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (replyTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyTo]);

  // Blocked user
  if (myState.is_blocked) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive/40" />
        <h2 className="text-xl font-bold text-foreground">Muhokamadan bloklangansiz</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Siz muhokama bo'limidan bloklangansiz. Agar bu xato deb hisoblasangiz, admin bilan bog'laning.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessagesSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Muhokama</h1>
          <p className="text-sm text-muted-foreground">Umumiy savol-javob va muhokama maydoni</p>
        </div>
      </div>

      {/* Message input */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-4">
        {myState.is_muted ? (
          <div className="flex items-center gap-3 text-amber-500 py-2">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">
              Siz vaqtincha xabar yoza olmaysiz
              {myState.muted_until && ` (${new Date(myState.muted_until).toLocaleString("uz-UZ")} gacha)`}
            </span>
          </div>
        ) : (
          <>
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-muted rounded-lg text-sm">
                <Reply className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary font-medium">{replyTo.display_name || replyTo.username}</span>
                <span className="text-muted-foreground truncate flex-1">{replyTo.message}</span>
                <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground ml-2">
                  &times;
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                placeholder="Xabar yozing..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                maxLength={2000}
                className="resize-none flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
                size="icon"
                className="h-auto"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {sendMutation.isError && (
              <p className="text-sm text-destructive mt-2">
                {(sendMutation.error as any)?.response?.data?.message || "Xabar yuborib bo'lmadi"}
              </p>
            )}
          </>
        )}
      </div>

      {/* Messages */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center py-16 gap-4">
          <AlertCircle className="h-12 w-12 text-destructive/40" />
          <p className="text-muted-foreground">Yuklab bo'lmadi</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-4">
          <MessagesSquare className="h-16 w-16 text-muted-foreground/20" />
          <p className="text-muted-foreground text-lg">Hali xabarlar yo'q</p>
          <p className="text-muted-foreground text-sm">Birinchi bo'lib xabar yozing!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const isOwn = msg.user_id === user?.id;
            const isDeleted = msg.status === "deleted";
            const isHidden = msg.status === "hidden";

            return (
              <div
                key={msg.id}
                className={`rounded-2xl border border-border p-4 transition-colors ${
                  isDeleted || isHidden
                    ? "bg-muted/30 opacity-60"
                    : isOwn
                    ? "bg-primary/5 border-primary/20"
                    : "bg-card"
                }`}
              >
                {/* Reply context */}
                {msg.reply_to && (
                  <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-muted/50 rounded-lg text-xs">
                    <Reply className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">
                      {msg.reply_to.display_name || msg.reply_to.username}
                    </span>
                    <span className="text-muted-foreground truncate">{msg.reply_to.message}</span>
                  </div>
                )}

                {/* Message header */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="font-medium text-sm text-foreground">
                    {msg.display_name || msg.username || "Foydalanuvchi"}
                  </span>
                  {isOwn && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Siz</Badge>}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(msg.created_at).toLocaleString("uz-UZ", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                  {msg.is_edited && <span className="text-[10px] text-muted-foreground">(tahrirlangan)</span>}
                </div>

                {/* Message body */}
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  isDeleted || isHidden ? "italic text-muted-foreground" : "text-foreground"
                }`}>
                  {msg.message}
                </p>

                {/* Actions */}
                {!isDeleted && !isHidden && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => setReplyTo(msg)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Reply className="h-3 w-3" /> Javob
                    </button>
                    {isOwn && (
                      <button
                        onClick={() => {
                          if (confirm("Xabarni o'chirmoqchimisiz?")) {
                            deleteMutation.mutate(msg.id);
                          }
                        }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors ml-auto"
                      >
                        <Trash2 className="h-3 w-3" /> O'chirish
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-3 py-4">
              <Button
                variant="outline" size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page} / {pagination.total_pages}</span>
              <Button
                variant="outline" size="sm"
                onClick={() => setPage(Math.min(pagination.total_pages, page + 1))}
                disabled={page >= pagination.total_pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
