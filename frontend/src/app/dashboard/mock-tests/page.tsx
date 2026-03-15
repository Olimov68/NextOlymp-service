"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Search,
  Clock,
  FileText,
  BookOpen,
  Zap,
  FlaskConical,
  Leaf,
  Monitor,
  Trophy,
  ClipboardCheck,
} from "lucide-react";
import { listMockTests } from "@/lib/user-api";
import type { MockExam } from "@/lib/api";

const subjectIcons: Record<string, React.ElementType> = {
  Mathematics: Zap,
  Physics: BookOpen,
  Chemistry: FlaskConical,
  Biology: Leaf,
  Informatics: Monitor,
};

const subjectOptions = [
  { value: "", label: "Barcha fanlar" },
  { value: "Mathematics", label: "Matematika" },
  { value: "Physics", label: "Fizika" },
  { value: "Chemistry", label: "Kimyo" },
  { value: "Biology", label: "Biologiya" },
  { value: "Informatics", label: "Informatika" },
];

const paidOptions = [
  { value: "", label: "Barchasi" },
  { value: "free", label: "Bepul" },
  { value: "paid", label: "Pullik" },
];

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex gap-4 mb-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex items-center justify-between pt-3">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function MockTestsListPage() {
  const [mockTests, setMockTests] = useState<MockExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [paidFilter, setPaidFilter] = useState("");

  useEffect(() => {
    listMockTests({ page: 1, page_size: 100 })
      .then((data) => {
        let list: MockExam[] = [];
        if (Array.isArray(data)) list = data;
        else if ((data as any)?.data && Array.isArray((data as any).data)) list = (data as any).data;
        else if ((data as any)?.items && Array.isArray((data as any).items)) list = (data as any).items;
        setMockTests(list);
      })
      .catch((err) => {
        console.error("Mock tests load error:", err);
        setMockTests([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return mockTests.filter((m) => {
      if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (subjectFilter && m.subject !== subjectFilter) return false;
      if (paidFilter === "free" && m.price !== 0) return false;
      if (paidFilter === "paid" && m.price === 0) return false;
      return true;
    });
  }, [mockTests, search, subjectFilter, paidFilter]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-green-600" />
          Mock testlar
        </h1>
        <p className="text-muted-foreground mt-1">
          O&apos;zingizni sinab ko&apos;rish uchun mock testlarni yeching
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Test nomi bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background border border-border"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {subjectOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={paidFilter}
          onChange={(e) => setPaidFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {paidOptions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Mock testlar topilmadi</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Boshqa filtrlarni sinab ko&apos;ring
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => {
            const Icon = subjectIcons[m.subject] || Trophy;
            return (
              <Card
                key={m.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow h-full"
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center text-green-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge className="bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-0 font-medium">
                      {m.subject}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-foreground mb-2">{m.title}</h3>

                  {m.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {m.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {m.duration_minutes} daqiqa
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {m.questions_count} savol
                    </div>
                  </div>

                  {m.assessment_method && (
                    <div className="mb-2">
                      <Badge variant="outline" className="text-xs font-normal">
                        {m.assessment_method === "standard"
                          ? "Standart baholash"
                          : m.assessment_method === "rasch"
                          ? "Rasch baholash"
                          : m.assessment_method}
                      </Badge>
                    </div>
                  )}

                  <div className="mt-auto pt-3 flex items-center justify-between">
                    {m.price === 0 ? (
                      <Badge className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-0">
                        Bepul
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-0">
                        {m.price.toLocaleString()} so&apos;m
                      </Badge>
                    )}
                    <Link href={`/dashboard/mock-tests/${m.id}`}>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Batafsil
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
