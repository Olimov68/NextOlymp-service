"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchOlympiads, createOlympiad, updateOlympiad, deleteOlympiad, type Olympiad } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AdminOlympiadsPage() {
  const queryClient = useQueryClient();
  const { data: olympiads, isLoading } = useQuery({ queryKey: ["olympiads"], queryFn: fetchOlympiads });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Olympiad | null>(null);
  const [form, setForm] = useState({ title: "", subject: "", description: "", price: 0, status: "open", startDate: "", endDate: "" });

  const createMut = useMutation({
    mutationFn: createOlympiad,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["olympiads"] }); setOpen(false); resetForm(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Olympiad> }) => updateOlympiad(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["olympiads"] }); setOpen(false); resetForm(); },
  });

  const deleteMut = useMutation({
    mutationFn: deleteOlympiad,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["olympiads"] }),
  });

  function resetForm() {
    setForm({ title: "", subject: "", description: "", price: 0, status: "open", startDate: "", endDate: "" });
    setEditing(null);
  }

  function openEdit(o: Olympiad) {
    setEditing(o);
    setForm({
      title: o.title,
      subject: o.subject,
      description: o.description || "",
      price: o.price,
      status: o.status,
      startDate: o.startDate ? o.startDate.split("T")[0] : "",
      endDate: o.endDate ? o.endDate.split("T")[0] : "",
    });
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      updateMut.mutate({ id: editing.id, data: form });
    } else {
      createMut.mutate(form);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Olimpiadalar</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" /> Yangi olimpiada
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Olimpiadani tahrirlash" : "Yangi olimpiada"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Nomi</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Fan</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Tavsif</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Olimpiada haqida qisqacha ma'lumot..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Narx</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="open">Open</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Boshlanish sanasi</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tugash sanasi</Label>
                  <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={createMut.isPending || updateMut.isPending}>
                {editing ? "Saqlash" : "Yaratish"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Yuklanmoqda...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nomi</TableHead>
                  <TableHead>Fan</TableHead>
                  <TableHead>Narx</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Savollar</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {olympiads?.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.id}</TableCell>
                    <TableCell className="font-medium">{o.title}</TableCell>
                    <TableCell>{o.subject}</TableCell>
                    <TableCell>{o.price === 0 ? "Bepul" : `${o.price} so'm`}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{o.status}</Badge>
                    </TableCell>
                    <TableCell>{o._count?.questions ?? 0}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(o)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => deleteMut.mutate(o.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
