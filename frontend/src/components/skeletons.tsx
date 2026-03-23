import { Card, CardContent } from "@/components/ui/card";

/* ─── Dashboard Page Skeleton ─── */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      {/* Welcome */}
      <div>
        <div className="h-8 w-64 bg-muted rounded-lg" />
        <div className="h-4 w-40 bg-muted/60 rounded mt-2" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="space-y-2">
                <div className="h-6 w-10 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted/60 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="h-5 w-36 bg-muted rounded" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-border last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted/60 rounded" />
                </div>
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-4 w-14 bg-muted rounded" />
                <div className="h-5 w-10 bg-muted/60 rounded-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-44 bg-muted/60 rounded" />
                </div>
              </div>
              <div className="h-5 w-5 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Card List Skeleton (for olympiads, mock-tests, results pages) ─── */
export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 bg-muted rounded-lg" />
        <div className="h-9 w-24 bg-muted rounded-lg" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-40 bg-muted rounded" />
                <div className="h-5 w-16 bg-muted/60 rounded-full" />
              </div>
              <div className="h-3 w-full bg-muted/40 rounded" />
              <div className="h-3 w-3/4 bg-muted/40 rounded" />
              <div className="flex items-center gap-3 pt-2">
                <div className="h-8 w-20 bg-muted rounded-lg" />
                <div className="h-8 w-20 bg-muted rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Table Skeleton (for admin pages) ─── */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      {/* Search/filter bar */}
      <div className="flex items-center gap-3">
        <div className="h-10 flex-1 max-w-sm bg-muted rounded-lg" />
        <div className="h-10 w-28 bg-muted rounded-lg" />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Header */}
        <div className="flex gap-4 p-3 bg-muted/30 border-b border-border">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 flex-1 bg-muted rounded" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-3 border-b border-border last:border-b-0">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-4 flex-1 bg-muted/60 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Profile Skeleton ─── */
export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl space-y-6 animate-pulse">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-muted rounded" />
          <div className="h-4 w-28 bg-muted/60 rounded" />
        </div>
      </div>

      {/* Form fields */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-muted/60 rounded" />
          <div className="h-10 w-full bg-muted rounded-lg" />
        </div>
      ))}

      {/* Button */}
      <div className="h-10 w-32 bg-muted rounded-lg" />
    </div>
  );
}
