"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOlympiads, type Olympiad } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, BookOpen, Zap, FlaskConical, Leaf, Monitor, Trophy } from "lucide-react";

const subjectIcons: Record<string, React.ElementType> = {
  Mathematics: Zap,
  Physics: BookOpen,
  Chemistry: FlaskConical,
  Biology: Leaf,
  Informatics: Monitor,
};

const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "Informatics"];

function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    upcoming: "bg-amber-100 text-amber-700",
    completed: "bg-gray-100 text-gray-600",
  };
  return (
    <Badge className={`${colors[status] || colors.upcoming} border-0 font-medium`}>
      {t(`olympiads.status.${status}`) || status}
    </Badge>
  );
}

function OlympiadCard({ o }: { o: Olympiad }) {
  const { t } = useI18n();
  const Icon = subjectIcons[o.subject] || Trophy;
  return (
    <Link href={`/dashboard/olympiads/${o.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon className="h-6 w-6" />
            </div>
            <StatusBadge status={o.status} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{o.title}</h3>
          <p className="text-sm text-gray-500 mb-3">{t("olympiads.subject")}: {o.subject}</p>
          {o.startDate && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar className="h-3 w-3" />
              {new Date(o.startDate).toLocaleDateString()} - {o.endDate ? new Date(o.endDate).toLocaleDateString() : ""}
            </div>
          )}
          <div className="mt-3">
            {o.price === 0 ? (
              <Badge className="bg-green-50 text-green-700 border-0">{t("olympiads.free")}</Badge>
            ) : (
              <Badge className="bg-orange-50 text-orange-700 border-0">{o.price.toLocaleString()} so&apos;m</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardOlympiadsPage() {
  const { t } = useI18n();
  const { data: olympiads, isLoading } = useQuery({ queryKey: ["olympiads"], queryFn: fetchOlympiads });

  const active = olympiads?.filter((o) => o.status === "active") || [];
  const upcoming = olympiads?.filter((o) => o.status === "upcoming") || [];

  if (isLoading) {
    return <div className="text-gray-400 p-8 text-center">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.olympiads")}</h1>
        <p className="text-gray-500 mt-1">{t("olympiads.desc")}</p>
      </div>

      {/* Subjects */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("olympiads.subjects")}</h2>
        <div className="flex flex-wrap gap-3">
          {subjects.map((s) => {
            const Icon = subjectIcons[s] || Trophy;
            return (
              <div
                key={s}
                className="flex items-center gap-2 rounded-xl bg-white border px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm"
              >
                <Icon className="h-4 w-4 text-blue-600" />
                {s}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Olympiads */}
      {active.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("olympiads.current")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map((o) => <OlympiadCard key={o.id} o={o} />)}
          </div>
        </div>
      )}

      {/* Upcoming Olympiads */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("olympiads.upcoming")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((o) => <OlympiadCard key={o.id} o={o} />)}
          </div>
        </div>
      )}

      {active.length === 0 && upcoming.length === 0 && (
        <div className="text-center text-gray-400 py-12">Hozircha olimpiadalar mavjud emas</div>
      )}
    </div>
  );
}
