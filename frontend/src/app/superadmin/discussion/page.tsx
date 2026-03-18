"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  saGetDiscussionMessages,
  saDeleteDiscussionMessage,
  saHideDiscussionMessage,
  saUnhideDiscussionMessage,
  saGetDiscussionUsers,
  saMuteDiscussionUser,
  saUnmuteDiscussionUser,
  saBlockDiscussionUser,
  saUnblockDiscussionUser,
} from "@/lib/superadmin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  MessagesSquare, Trash2, Eye, EyeOff, Search, Loader2,
  VolumeX, Volume2, ShieldBan, ShieldCheck, Users,
} from "lucide-react";

export default function SuperAdminDiscussionPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"messages" | "users">("messages");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: msgData, isLoading: msgLoading } = useQuery({
    queryKey: ["sa-discussion-messages", search, page],
    queryFn: () => saGetDiscussionMessages({ search, page, page_size: 30 }),
    enabled: tab === "messages",
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["sa-discussion-users"],
    queryFn: () => saGetDiscussionUsers(),
    enabled: tab === "users",
  });

  const deleteMut = useMutation({ mutationFn: saDeleteDiscussionMessage, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sa-discussion-messages"] }) });
  const hideMut = useMutation({ mutationFn: saHideDiscussionMessage, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sa-discussion-messages"] }) });
  const unhideMut = useMutation({ mutationFn: saUnhideDiscussionMessage, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sa-discussion-messages"] }) });
  const muteMut = useMutation({ mutationFn: (id: number) => saMuteDiscussionUser(id, { hours: 24, reason: "SuperAdmin tomonidan" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sa-discussion-users"] }) });
  const unmuteMut = useMutation({ mutationFn: saUnmuteDiscussionUser, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sa-discussion-users"] }) });
  const blockMut = useMutation({ mutationFn: (id: number) => saBlockDiscussionUser(id, { reason: "SuperAdmin tomonidan bloklandi" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sa-discussion-users"] }) });
  const unblockMut = useMutation({ mutationFn: saUnblockDiscussionUser, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sa-discussion-users"] }) });

  const messages = msgData?.items || [];
  const users = usersData?.items || [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessagesSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Muhokama boshqaruvi</h1>
          <p className="text-sm text-muted-foreground">Xabarlarni moderatsiya qilish, foydalanuvchilarni boshqarish</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Button variant={tab === "messages" ? "default" : "outline"} size="sm" onClick={() => setTab("messages")}>
          <MessagesSquare className="h-4 w-4 mr-1" /> Xabarlar
        </Button>
        <Button variant={tab === "users" ? "default" : "outline"} size="sm" onClick={() => setTab("users")}>
          <Users className="h-4 w-4 mr-1" /> Foydalanuvchilar
        </Button>
      </div>

      {tab === "messages" && (
        <>
          <div className="relative max-w-xs mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Qidirish..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          {msgLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foydalanuvchi</TableHead>
                    <TableHead>Xabar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Xabarlar yo'q</TableCell></TableRow>
                  ) : messages.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.display_name || m.username}</TableCell>
                      <TableCell className="max-w-xs truncate">{m.message}</TableCell>
                      <TableCell><Badge variant={m.status === "active" ? "default" : m.status === "hidden" ? "secondary" : "destructive"}>{m.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(m.created_at).toLocaleString("uz-UZ")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {m.status === "active" && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => hideMut.mutate(m.id)}><EyeOff className="h-4 w-4" /></Button>}
                          {m.status === "hidden" && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => unhideMut.mutate(m.id)}><Eye className="h-4 w-4" /></Button>}
                          {m.status !== "deleted" && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("O'chirmoqchimisiz?")) deleteMut.mutate(m.id); }}><Trash2 className="h-4 w-4" /></Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {tab === "users" && (
        <>
          {usersLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Muted/blocked foydalanuvchilar yo'q</div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foydalanuvchi</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Sabab</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || u.username}</TableCell>
                      <TableCell>
                        {u.is_blocked && <Badge variant="destructive">Bloklangan</Badge>}
                        {u.is_muted && !u.is_blocked && <Badge variant="secondary">Muted</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.reason || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {u.is_muted && <Button variant="outline" size="sm" onClick={() => unmuteMut.mutate(u.user_id)}><Volume2 className="h-3.5 w-3.5 mr-1" /> Unmute</Button>}
                          {!u.is_muted && !u.is_blocked && <Button variant="outline" size="sm" onClick={() => muteMut.mutate(u.user_id)}><VolumeX className="h-3.5 w-3.5 mr-1" /> Mute</Button>}
                          {u.is_blocked ? (
                            <Button variant="outline" size="sm" onClick={() => unblockMut.mutate(u.user_id)}><ShieldCheck className="h-3.5 w-3.5 mr-1" /> Unblock</Button>
                          ) : (
                            <Button variant="destructive" size="sm" onClick={() => blockMut.mutate(u.user_id)}><ShieldBan className="h-3.5 w-3.5 mr-1" /> Block</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
