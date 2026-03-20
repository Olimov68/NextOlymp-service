"use client";

import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Search, ClipboardCheck } from "lucide-react";
import { listMockTests } from "@/lib/user-api";
import AssessmentCard from "@/components/assessment/AssessmentCard";
import type { AssessmentBase } from "@/lib/assessment-types";

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

const gradeOptions = [
  { value: "", label: "Barcha sinflar" },
  ...Array.from({ length: 7 }, (_, i) => ({
    value: String(i + 5),
    label: `${i + 5}-sinf`,
  })),
];

const languageOptions = [
  { value: "", label: "Barcha tillar" },
  { value: "uz", label: "O\u2018zbek" },
  { value: "ru", label: "Rus" },
  { value: "en", label: "Ingliz" },
];

function mapToAssessment(o: Record<string, any>): AssessmentBase {
  return {
    id: o.id,
    title: o.title ?? "",
    slug: o.slug ?? "",
    description: o.description ?? "",
    subject: o.subject ?? "",
    grade: o.grade ?? 0,
    language: o.language ?? "",
    start_time: o.start_time ?? o.start_date ?? undefined,
    end_time: o.end_time ?? o.end_date ?? undefined,
    duration_minutes: o.duration_minutes ?? 0,
    total_questions: o.total_questions ?? o.questions_count ?? 0,
    rules: o.rules ?? "",
    status: o.status ?? "",
    is_paid: typeof o.is_paid === "boolean" ? o.is_paid : (o.price != null && o.price > 0),
    price: o.price ?? 0,
    banner_url: o.banner_url ?? "",
    icon_url: o.icon_url ?? "",
    registration_start_time: o.registration_start_time,
    registration_end_time: o.registration_end_time,
    max_seats: o.max_seats ?? 0,
    shuffle_questions: o.shuffle_questions ?? false,
    shuffle_answers: o.shuffle_answers ?? false,
    auto_submit: o.auto_submit ?? false,
    allow_retake: o.allow_retake ?? false,
    show_result_immediately: o.show_result_immediately ?? false,
    give_certificate: o.give_certificate ?? false,
    manual_review: o.manual_review ?? false,
    admin_approval: o.admin_approval ?? false,
    min_score_for_certificate: o.min_score_for_certificate ?? 0,
    scoring_rules: o.scoring_rules ?? "",
    registered_count: o.registered_count,
    participants_count: o.participants_count,
    created_at: o.created_at ?? "",
    updated_at: o.updated_at ?? "",
  };
}

function isFree(o: AssessmentBase): boolean {
  return !o.is_paid || !o.price;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <div className="space-y-2 mb-4">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const selectClasses =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

export default function MockTestsListPage() {
  const [mockTests, setMockTests] = useState<AssessmentBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [paidFilter, setPaidFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    listMockTests({ page: 1, page_size: 100 })
      .then((data) => {
        let list: any[] = [];
        if (Array.isArray(data)) list = data;
        else if ((data as any)?.data && Array.isArray((data as any).data)) list = (data as any).data;
        else if ((data as any)?.items && Array.isArray((data as any).items)) list = (data as any).items;
        setMockTests(list.map(mapToAssessment));
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
      if (paidFilter === "free" && !isFree(m)) return false;
      if (paidFilter === "paid" && isFree(m)) return false;
      if (gradeFilter && m.grade !== Number(gradeFilter)) return false;
      if (languageFilter && m.language !== languageFilter) return false;
      return true;
    });
  }, [mockTests, search, subjectFilter, paidFilter, gradeFilter, languageFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useMemo(() => { setPage(1); }, [search, subjectFilter, paidFilter, gradeFilter, languageFilter]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className={selectClasses}>
          {subjectOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select value={paidFilter} onChange={(e) => setPaidFilter(e.target.value)} className={selectClasses}>
          {paidOptions.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className={selectClasses}>
          {gradeOptions.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>

        <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} className={selectClasses}>
          {languageOptions.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <ClipboardCheck className="h-12 w-12 mb-4 opacity-20" />
          <p className="font-medium">Mock testlar topilmadi</p>
          <p className="text-sm mt-1 opacity-70">Boshqa filtrlarni sinab ko&apos;ring</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((m) => (
              <AssessmentCard key={m.id} assessment={m} examType="mock_test" />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={filtered.length} />
        </>
      )}
    </div>
  );
}
