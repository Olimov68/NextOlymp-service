"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-context";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Trophy, MapPin, ClipboardCheck, Globe } from "lucide-react";
import Link from "next/link";

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K+`;
  return `${n}+`;
}

export function HeroSection() {
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    retry: 1,
  });
  const { t, lang } = useI18n();
  const settings = useSettings();
  const platformName = settings.platform_name || "NextOly";

  const heroTitle: Record<string, React.ReactNode> = {
    uz: (
      <>
        Xalqaro fan olimpiadalarini{" "}
        <span className="gradient-text">
          zamonaviy platformada
        </span>{" "}
        topshiring
      </>
    ),
    ru: (
      <>
        Сдавайте международные олимпиады на{" "}
        <span className="gradient-text">
          современной платформе
        </span>
      </>
    ),
    en: (
      <>
        Take international olympiads on a{" "}
        <span className="gradient-text">
          modern platform
        </span>
      </>
    ),
  };

  const heroTagline: Record<string, string> = {
    uz: "NextOly — xavfsiz, adolatli va professional online imtihon platformasi",
    ru: "NextOly — безопасная, справедливая и профессиональная платформа онлайн-экзаменов",
    en: "NextOly — a secure, fair and professional online exam platform",
  };

  const statItems = [
    { icon: Users,         label: t("stats.students"),   value: stats?.total_users },
    { icon: Trophy,        label: t("stats.olympiads"),  value: stats?.total_olympiads },
    { icon: MapPin,        label: t("stats.regions"),    value: stats?.total_regions },
    { icon: ClipboardCheck,label: t("stats.mock_tests"), value: stats?.total_mock_tests },
  ];

  return (
    <section className="relative overflow-hidden bg-background hero-mesh">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-500/8 blur-3xl dark:bg-blue-500/12" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-indigo-500/8 blur-3xl dark:bg-indigo-500/10" />
        <div className="absolute top-1/2 left-0 h-64 w-64 -translate-y-1/2 rounded-full bg-blue-400/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 lg:py-28 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6">
              <Globe className="h-4 w-4" />
              {t("hero.badge")}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-foreground">
              {heroTitle[lang] || heroTitle.uz}
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              {heroTagline[lang] || heroTagline.uz}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="btn-gradient gap-2"
                >
                  {t("hero.register")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/olympiads">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 bg-transparent"
                >
                  {t("hero.view_olympiads")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: floating card */}
          <div className="relative hidden lg:block">
            <div className="rounded-3xl bg-card border border-border p-8 shadow-2xl glow-blue animate-float">
              <div className="text-center mb-6">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-2xl shadow-lg shadow-blue-500/30 mb-3 animate-pulse-glow">
                  NO
                </div>
                <h3 className="text-2xl font-bold text-foreground">{platformName}</h3>
                <p className="text-muted-foreground text-sm">International Olympiad Platform</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { val: stats ? formatNumber(stats.total_users)    : "...", key: t("stats.students") },
                  { val: stats ? formatNumber(stats.total_olympiads) : "...", key: t("stats.olympiads") },
                  { val: stats ? formatNumber(stats.total_regions)   : "...", key: t("stats.regions") },
                ].map((s) => (
                  <div key={s.key} className="rounded-xl bg-background border border-border p-3">
                    <div className="text-xl font-bold text-foreground">{s.val}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.key}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badge: 1st place */}
            <div className="absolute -top-4 -right-4 rounded-2xl bg-card border border-border p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥇</span>
                <div>
                  <div className="text-xs font-bold text-foreground">1st Place</div>
                  <div className="text-xs text-muted-foreground">Mathematics</div>
                </div>
              </div>
            </div>

            {/* Badge: new users */}
            <div className="absolute -bottom-4 -left-4 rounded-2xl bg-card border border-border p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-xs font-bold text-foreground">+1,240</div>
                  <div className="text-xs text-muted-foreground">New this month</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
          {statItems.map((item) => (
            <div key={item.label} className="stat-card rounded-2xl p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">
                {item.value != null
                  ? item.value > 0
                    ? item.value.toLocaleString() + "+"
                    : "0"
                  : "..."}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
