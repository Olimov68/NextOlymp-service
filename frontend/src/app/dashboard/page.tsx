"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Trophy, ClipboardCheck, BarChart3, MessageCircle,
  ChevronRight, Calendar, ArrowRight,
} from "lucide-react";
import {
  getMyOlympiads, getMyMockTests, getMyResults,
  type UserResult,
} from "@/lib/user-api";
import type { Olympiad, MockExam } from "@/lib/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const [myOlympiads, setMyOlympiads] = useState<Olympiad[]>([]);
  const [myMockTests, setMyMockTests] = useState<MockExam[]>([]);
  const [recentResults, setRecentResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getMyOlympiads().then(d => setMyOlympiads(Array.isArray(d) ? d : [])),
      getMyMockTests().then(d => setMyMockTests(Array.isArray(d) ? d : [])),
      getMyResults({ limit: 5 }).then(d => setRecentResults(Array.isArray(d) ? d : [])),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Xush kelibsiz{user?.username ? `, ${user.username}` : ""}!
        </h1>
        <p className="text-muted-foreground mt-1">Shaxsiy kabinetingiz</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard" className="block">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{myOlympiads.length}</p>
                <p className="text-xs text-muted-foreground">Olimpiadalarim</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/mock-tests" className="block">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{myMockTests.length}</p>
                <p className="text-xs text-muted-foreground">Mock testlar</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/leaderboard" className="block">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{recentResults.length}</p>
                <p className="text-xs text-muted-foreground">Natijalarim</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/chat" className="block">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">Chat</p>
                <p className="text-xs text-muted-foreground">Global chat</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Results */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              So&apos;nggi natijalar
            </h2>
          </div>
          {recentResults.length === 0 ? (
            <div className="p-8 text-center">
              <ClipboardCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Hozircha natija yo&apos;q</p>
              <Link href="/dashboard/mock-tests" className="inline-flex items-center gap-1 text-sm text-primary mt-2">
                Birinchi testni boshlash <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      r.type === "olympiad" ? "bg-amber-500/10" : "bg-primary/10"
                    }`}>
                      {r.type === "olympiad" ? (
                        <Trophy className="h-4 w-4 text-amber-500" />
                      ) : (
                        <ClipboardCheck className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {r.date || new Date(r.created_at).toLocaleDateString("uz-UZ")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{r.score}/{r.max_score}</p>
                    <Badge className={`border-0 text-[10px] ${
                      r.percentage >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" :
                      r.percentage >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                    }`}>
                      {r.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/mock-tests" className="block">
          <Card className="border-0 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Mock test ishlash</p>
                  <p className="text-xs text-muted-foreground">Fan bo&apos;yicha testlarni tanlang</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/leaderboard" className="block">
          <Card className="border-0 shadow-sm hover:shadow-md hover:border-green-500/20 transition-all cursor-pointer">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Reytingni ko&apos;rish</p>
                  <p className="text-xs text-muted-foreground">Fan va sinf bo&apos;yicha reyting</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
