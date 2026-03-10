"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchResults, createResult, deleteResult, fetchOlympiads, fetchUsers } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

const subjects = ["mathematics", "physics", "chemistry", "biology", "informatics"];

export default function AdminResultsPage() {
  const queryClient = useQueryClient();
  const [activeSubject, setActiveSubject] = useState("mathematics");
  const { data: results, isLoading } = useQuery({
    queryKey: ["results", activeSubject],
    queryFn: () => fetchResults(activeSubject),
  });
  const { data: olympiads } = useQuery({ queryKey: ["olympiads"], queryFn: fetchOlympiads });
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ userId: 0, olympiadId: 0, subject: "mathematics", score: 0, medal: "", country: "" });

  const createMut = useMutation({
    mutationFn: createResult,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["results"] }); setOpen(false); },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMut.mutate(form);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Natijalar</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" /> {"Natija qo'shish"}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi natija</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Foydalanuvchi</Label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: Number(e.target.value) })}
                  required
                >
                  <option value={0}>Tanlang...</option>
                  {users?.map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Olimpiada</Label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.olympiadId}
                  onChange={(e) => setForm({ ...form, olympiadId: Number(e.target.value) })}
                  required
                >
                  <option value={0}>Tanlang...</option>
                  {olympiads?.map((o) => (
                    <option key={o.id} value={o.id}>{o.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fan</Label>
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  >
                    {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Ball</Label>
                  <Input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Medal</Label>
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={form.medal}
                    onChange={(e) => setForm({ ...form, medal: e.target.value })}
                  >
                    <option value="">Yo&apos;q</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Bronze">Bronze</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Mamlakat</Label>
                  <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={createMut.isPending}>
                Yaratish
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSubject(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
              activeSubject === s ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Yuklanmoqda...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Ism</TableHead>
                  <TableHead>Mamlakat</TableHead>
                  <TableHead>Ball</TableHead>
                  <TableHead>Medal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results?.map((r) => (
                  <TableRow key={`${r.rank}-${r.name}`}>
                    <TableCell className="font-bold text-gray-500">{r.rank}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.country}</TableCell>
                    <TableCell className="font-semibold">{r.score}</TableCell>
                    <TableCell>
                      {r.medal ? (
                        <Badge variant="outline" className="capitalize">{r.medal}</Badge>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
