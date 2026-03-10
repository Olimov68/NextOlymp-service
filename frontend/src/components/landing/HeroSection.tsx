"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Users, Medal, Heart } from "lucide-react";
import Link from "next/link";

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K+`;
  return `${n}+`;
}

export function HeroSection() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchStats });
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-4 py-20 lg:py-28 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 backdrop-blur-sm px-4 py-1.5 text-sm text-blue-300 mb-6">
              <Globe className="h-4 w-4" />
              {t("hero.badge")}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              NextOly —{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">International Online Olympiad</span>
            </h1>
            <p className="text-lg text-blue-100/70 mb-8 max-w-lg">
              {t("hero.desc")}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 gap-2 shadow-lg shadow-blue-500/25 border-0 text-white">
                  {t("hero.register")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#olympiads">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
                  {t("hero.view_olympiads")}
                </Button>
              </a>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 text-white shadow-2xl">
              <div className="text-center mb-6">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-2xl shadow-lg shadow-blue-500/25 mb-3">
                  NO
                </div>
                <h3 className="text-2xl font-bold">NextOly</h3>
                <p className="text-blue-300/60">International Olympiad Platform</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl bg-white/5 p-3">
                  <div className="text-2xl font-bold">{stats ? formatNumber(stats.countries) : "..."}</div>
                  <div className="text-xs text-blue-300/60">{t("stats.countries")}</div>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <div className="text-2xl font-bold">{stats ? formatNumber(stats.students) : "..."}</div>
                  <div className="text-xs text-blue-300/60">{t("stats.students")}</div>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <div className="text-2xl font-bold">{stats ? formatNumber(stats.medals) : "..."}</div>
                  <div className="text-xs text-blue-300/60">{t("stats.medals")}</div>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">🥇</span>
                <div>
                  <div className="text-xs font-bold text-white">1st Place</div>
                  <div className="text-xs text-blue-300/60">Mathematics</div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="text-xs font-bold text-white">+1,240</div>
                  <div className="text-xs text-blue-300/60">New this month</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
          {[
            { icon: Globe, label: t("stats.countries"), value: stats?.countries },
            { icon: Users, label: t("stats.students"), value: stats?.students },
            { icon: Medal, label: t("stats.medals"), value: stats?.medals },
            { icon: Heart, label: t("stats.volunteers"), value: stats?.volunteers },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <item.icon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white">
                {item.value != null ? item.value.toLocaleString() + "+" : "..."}
              </div>
              <div className="text-sm text-blue-300/60 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
