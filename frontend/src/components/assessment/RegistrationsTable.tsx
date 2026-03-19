"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Users } from "lucide-react";
import type { AssessmentRegistration } from "@/lib/assessment-types";

interface RegistrationsTableProps {
  registrations: AssessmentRegistration[];
  loading?: boolean;
}

const statusColors: Record<string, string> = {
  registered: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  confirmed: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  started: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const statusLabels: Record<string, string> = {
  registered: "Ro'yxatdan o'tgan",
  confirmed: "Tasdiqlangan",
  cancelled: "Bekor qilingan",
  started: "Boshlagan",
  completed: "Yakunlagan",
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

export default function RegistrationsTable({
  registrations,
  loading = false,
}: RegistrationsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <Users className="h-10 w-10 mb-3 opacity-30" />
        <p>Ro&apos;yxatdan o&apos;tganlar topilmadi</p>
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
            <TableHead>Username</TableHead>
            <TableHead>Holat</TableHead>
            <TableHead>Ro&apos;yxatdan o&apos;tgan vaqt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((reg, index) => {
            const fullName =
              reg.user
                ? reg.user.full_name
                : `${reg.first_name ?? ""} ${reg.last_name ?? ""}`.trim() || "---";
            const username = reg.user?.username ?? reg.username ?? "---";

            return (
              <TableRow key={reg.id}>
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {reg.user?.avatar_url ? (
                      <img
                        src={reg.user.avatar_url}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                        {fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-foreground">{fullName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  @{username}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${statusColors[reg.status] || ""}`}
                  >
                    {statusLabels[reg.status] || reg.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(reg.joined_at || reg.registered_at)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
