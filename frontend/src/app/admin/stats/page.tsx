"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStats, updateStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";

export default function AdminStatsPage() {
  const queryClient = useQueryClient();
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchStats });
  const [form, setForm] = useState({ countries: 0, students: 0, medals: 0, volunteers: 0 });

  useEffect(() => {
    if (stats) {
      setForm({
        countries: stats.countries,
        students: stats.students,
        medals: stats.medals,
        volunteers: stats.volunteers,
      });
    }
  }, [stats]);

  const updateMut = useMutation({
    mutationFn: updateStats,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stats"] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMut.mutate(form);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Statistika</h1>

      <Card className="border-0 shadow-sm max-w-lg">
        <CardHeader>
          <CardTitle className="text-lg">Platformaning umumiy statistikasi</CardTitle>
          <p className="text-sm text-gray-500">Bu raqamlar bosh sahifada ko&apos;rsatiladi</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Mamlakatlar soni</Label>
              <Input type="number" value={form.countries} onChange={(e) => setForm({ ...form, countries: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Ishtirokchilar soni</Label>
              <Input type="number" value={form.students} onChange={(e) => setForm({ ...form, students: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Medallar soni</Label>
              <Input type="number" value={form.medals} onChange={(e) => setForm({ ...form, medals: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Ko&apos;ngillilar soni</Label>
              <Input type="number" value={form.volunteers} onChange={(e) => setForm({ ...form, volunteers: Number(e.target.value) })} />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 gap-2" disabled={updateMut.isPending}>
              <Save className="h-4 w-4" />
              {updateMut.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            {updateMut.isSuccess && (
              <div className="rounded-lg bg-green-50 text-green-600 text-sm p-3 text-center">Muvaffaqiyatli saqlandi!</div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
