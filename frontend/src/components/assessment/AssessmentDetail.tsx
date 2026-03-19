"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock, BookOpen, Users, Calendar, Globe, GraduationCap,
  DollarSign, Loader2, Image as ImageIcon, Trophy,
} from "lucide-react";
import type { ExamType, AssessmentBase, AssessmentRegistration } from "@/lib/assessment-types";
import {
  getAssessmentDisplayStatus,
  getStatusLabel,
  getStatusBadgeColor,
  type AssessmentDisplayStatus,
} from "@/lib/assessment-types";

interface AssessmentDetailProps {
  assessment: AssessmentBase;
  examType: ExamType;
  registration?: AssessmentRegistration | null;
  onJoin: () => void;
  onStart: () => void;
  loading?: boolean;
}

const languageLabels: Record<string, string> = {
  uz: "O'zbek",
  ru: "Rus",
  en: "Ingliz",
};

function formatDateTime(iso?: string): string {
  if (!iso) return "---";
  try {
    return new Date(iso).toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "---";
  }
}

function getActionButton(
  displayStatus: AssessmentDisplayStatus,
  registration: AssessmentRegistration | null | undefined,
  assessment: AssessmentBase,
  onJoin: () => void,
  onStart: () => void,
  loading: boolean
): React.ReactNode {
  const isRegistered = registration && registration.status !== "cancelled";
  const seatsFull = assessment.max_seats > 0 && (assessment.registered_count ?? 0) >= assessment.max_seats;

  // Completed / archived - show results button
  if (displayStatus === "completed" || displayStatus === "archived") {
    if (isRegistered) {
      return (
        <Button size="lg" className="w-full" onClick={onStart}>
          Natijani ko&apos;rish
        </Button>
      );
    }
    return (
      <Button size="lg" className="w-full" disabled variant="outline">
        Yakunlangan
      </Button>
    );
  }

  // Active - can start exam
  if (displayStatus === "active") {
    if (isRegistered) {
      return (
        <Button size="lg" className="w-full" onClick={onStart} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Imtihonni boshlash
        </Button>
      );
    }
    return (
      <Button size="lg" className="w-full" disabled variant="outline">
        Ro&apos;yxatdan o&apos;tilmagan
      </Button>
    );
  }

  // Registration open
  if (displayStatus === "registration_open") {
    if (isRegistered) {
      return (
        <Button size="lg" className="w-full" disabled variant="outline">
          Ro&apos;yxatdan o&apos;tilgan
        </Button>
      );
    }
    if (seatsFull) {
      return (
        <Button size="lg" className="w-full" disabled variant="destructive">
          Joylar tugagan
        </Button>
      );
    }
    return (
      <Button size="lg" className="w-full" onClick={onJoin} disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Ro&apos;yxatdan o&apos;tish
      </Button>
    );
  }

  // Registration pending
  if (displayStatus === "registration_pending") {
    return (
      <Button size="lg" className="w-full" disabled variant="outline">
        Ro&apos;yxatdan o&apos;tish hali ochilmagan
      </Button>
    );
  }

  // Registration closed, upcoming
  if (displayStatus === "registration_closed" || displayStatus === "upcoming") {
    return (
      <Button size="lg" className="w-full" disabled variant="outline">
        Ro&apos;yxat yopilgan
      </Button>
    );
  }

  // Draft / published fallback
  return (
    <Button size="lg" className="w-full" disabled variant="outline">
      Tez kunda
    </Button>
  );
}

export default function AssessmentDetail({
  assessment,
  examType,
  registration,
  onJoin,
  onStart,
  loading = false,
}: AssessmentDetailProps) {
  const displayStatus = getAssessmentDisplayStatus(assessment);
  const statusLabel = getStatusLabel(displayStatus);
  const statusColor = getStatusBadgeColor(displayStatus);
  const isFree = !assessment.is_paid || !assessment.price;
  const typeLabel = examType === "mock_test" ? "Mock test" : "Olimpiada";

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden bg-muted">
        {assessment.banner_url ? (
          <img
            src={assessment.banner_url}
            alt={assessment.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{typeLabel}</p>
            </div>
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge className={`${statusColor} text-white border-0`}>
            {statusLabel}
          </Badge>
        </div>
      </div>

      {/* Title & badges */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          {assessment.title}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <BookOpen className="h-3 w-3" />
            {assessment.subject}
          </Badge>
          {assessment.grade > 0 && (
            <Badge variant="outline" className="gap-1">
              <GraduationCap className="h-3 w-3" />
              {assessment.grade}-sinf
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Globe className="h-3 w-3" />
            {languageLabels[assessment.language] || assessment.language}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: description + rules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {assessment.description && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                Tavsif
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {assessment.description}
              </p>
            </section>
          )}

          {/* Rules */}
          {assessment.rules && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                Qoidalar
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {assessment.rules}
              </p>
            </section>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Time info cards */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Vaqt
            </h2>
            <div className="space-y-3">
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Ro'yxatdan o'tish"
                value={
                  assessment.registration_start_time
                    ? `${formatDateTime(assessment.registration_start_time)} - ${formatDateTime(assessment.registration_end_time)}`
                    : "Belgilanmagan"
                }
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Imtihon vaqti"
                value={
                  assessment.start_time
                    ? `${formatDateTime(assessment.start_time)} - ${formatDateTime(assessment.end_time)}`
                    : "Belgilanmagan"
                }
              />
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label="Davomiyligi"
                value={`${assessment.duration_minutes} daqiqa`}
              />
            </div>
          </div>

          {/* Exam info */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Ma&apos;lumot
            </h2>
            <div className="space-y-3">
              {assessment.total_questions > 0 && (
                <InfoRow
                  icon={<BookOpen className="h-4 w-4" />}
                  label="Savollar"
                  value={`${assessment.total_questions} ta`}
                />
              )}
              {assessment.max_seats > 0 && (
                <InfoRow
                  icon={<Users className="h-4 w-4" />}
                  label="Joylar"
                  value={`${assessment.registered_count ?? 0} / ${assessment.max_seats}`}
                />
              )}
              <InfoRow
                icon={<DollarSign className="h-4 w-4" />}
                label="Narx"
                value={isFree ? "Bepul" : `${assessment.price?.toLocaleString()} UZS`}
              />
            </div>
          </div>

          {/* Action button */}
          <div>
            {getActionButton(displayStatus, registration, assessment, onJoin, onStart, loading)}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}
