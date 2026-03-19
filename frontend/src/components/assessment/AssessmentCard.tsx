"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock, BookOpen, Users, ChevronRight, Calendar, Trophy,
  DollarSign, Zap, FlaskConical, Leaf, Monitor,
} from "lucide-react";
import type { ExamType, AssessmentBase } from "@/lib/assessment-types";
import { getAssessmentDisplayStatus, getStatusLabel, getStatusBadgeColor } from "@/lib/assessment-types";

interface AssessmentCardProps {
  assessment: AssessmentBase;
  examType: ExamType;
}

const subjectIcons: Record<string, React.ElementType> = {
  Mathematics: Zap,
  Physics: BookOpen,
  Chemistry: FlaskConical,
  Biology: Leaf,
  Informatics: Monitor,
};

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("uz-UZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function AssessmentCard({ assessment, examType }: AssessmentCardProps) {
  const Icon = subjectIcons[assessment.subject] || Trophy;
  const displayStatus = getAssessmentDisplayStatus(assessment);
  const statusLabel = getStatusLabel(displayStatus);
  const statusColor = getStatusBadgeColor(displayStatus);
  const isFree = !assessment.is_paid || !assessment.price;
  const detailPath =
    examType === "olympiad"
      ? `/dashboard/olympiads/${assessment.id}`
      : `/dashboard/mock-tests/${assessment.id}`;

  const startDate = assessment.start_time;
  const endDate = assessment.end_time;

  return (
    <div className="group rounded-2xl border border-border bg-card p-6 flex flex-col hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      {/* Header: icon + status */}
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {assessment.icon_url ? (
            <img
              src={assessment.icon_url}
              alt=""
              className="h-8 w-8 rounded-lg object-cover"
            />
          ) : (
            <Icon className="h-6 w-6" />
          )}
        </div>
        <Badge className={`${statusColor} text-white border-0 text-xs`}>
          {statusLabel}
        </Badge>
      </div>

      {/* Title & subject */}
      <h3 className="font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
        {assessment.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-1">{assessment.subject}</p>

      {/* Grade badge */}
      {assessment.grade > 0 && (
        <Badge variant="outline" className="w-fit text-xs mb-3">
          {assessment.grade}-sinf
        </Badge>
      )}

      {/* Info rows */}
      <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
        {startDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>
              {formatDate(startDate)}
              {endDate && ` - ${formatDate(endDate)}`}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{assessment.duration_minutes} daqiqa</span>
        </div>
        {assessment.total_questions > 0 && (
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3 w-3 shrink-0" />
            <span>{assessment.total_questions} savol</span>
          </div>
        )}
        {assessment.max_seats > 0 && (
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3 shrink-0" />
            <span>
              {assessment.registered_count ?? 0} / {assessment.max_seats} joy
            </span>
          </div>
        )}
      </div>

      {/* Footer: price + link */}
      <div className="mt-auto pt-3 flex items-center justify-between border-t border-border">
        {isFree ? (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
            Bepul
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs gap-1">
            <DollarSign className="h-3 w-3" />
            {assessment.price?.toLocaleString()} UZS
          </Badge>
        )}
        <Link href={detailPath}>
          <Button size="sm" className="gap-1.5">
            Batafsil <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
