"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Trophy, CheckCircle } from "lucide-react";
import type { ExamType, AssessmentResult } from "@/lib/assessment-types";

interface ResultsTableProps {
  results: AssessmentResult[];
  examType: ExamType;
  onApprove?: (id: number) => void;
  loading?: boolean;
}

const resultStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-600 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
};

const resultStatusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
};

function formatTime(seconds?: number): string {
  if (!seconds) return "---";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ResultsTable({
  results,
  examType,
  onApprove,
  loading = false,
}: ResultsTableProps) {
  const isMock = examType === "mock_test";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <Trophy className="h-10 w-10 mb-3 opacity-30" />
        <p>Natijalar topilmadi</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Foydalanuvchi</TableHead>
            <TableHead className="text-right">Ball</TableHead>
            <TableHead className="text-right">Foiz</TableHead>
            <TableHead className="text-right">To&apos;g&apos;ri</TableHead>
            <TableHead className="text-right">Noto&apos;g&apos;ri</TableHead>
            <TableHead className="text-right">O&apos;rin</TableHead>
            <TableHead className="text-right">Vaqt</TableHead>
            {isMock && (
              <>
                <TableHead className="text-right">Theta</TableHead>
                <TableHead className="text-right">Scaled</TableHead>
                <TableHead>Grade</TableHead>
              </>
            )}
            <TableHead>Holat</TableHead>
            {onApprove && <TableHead className="text-right">Amallar</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => {
            const fullName =
              result.user
                ? result.user.full_name
                : `${result.first_name ?? ""} ${result.last_name ?? ""}`.trim() || "---";
            const username = result.user?.username ?? result.username ?? "---";

            return (
              <TableRow key={result.id}>
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {result.user?.avatar_url ? (
                      <img
                        src={result.user.avatar_url}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                        {fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground text-sm">{fullName}</p>
                      <p className="text-xs text-muted-foreground">@{username}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  {result.score}/{result.max_score}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`font-medium ${
                      result.percentage >= 70
                        ? "text-green-600"
                        : result.percentage >= 40
                        ? "text-amber-600"
                        : "text-red-500"
                    }`}
                  >
                    {result.percentage.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {result.correct}
                </TableCell>
                <TableCell className="text-right text-red-500">
                  {result.wrong}
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  {result.rank ?? "---"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatTime(result.time_taken)}
                </TableCell>
                {isMock && (
                  <>
                    <TableCell className="text-right text-muted-foreground">
                      {result.theta_score?.toFixed(2) ?? "---"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {result.scaled_score?.toFixed(1) ?? "---"}
                    </TableCell>
                    <TableCell>
                      {result.grade_label ? (
                        <Badge variant="outline" className="text-xs">
                          {result.grade_label}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">---</span>
                      )}
                    </TableCell>
                  </>
                )}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${resultStatusColors[result.status] || ""}`}
                  >
                    {resultStatusLabels[result.status] || result.status}
                  </Badge>
                </TableCell>
                {onApprove && (
                  <TableCell className="text-right">
                    {result.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                        onClick={() => onApprove(result.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Tasdiqlash
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
