"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Users, Medal, Heart } from "lucide-react";

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K+`;
  return `${n}+`;
}

export function HeroSection() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchStats });

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-700 mb-6">
              <Globe className="h-4 w-4" />
              Xalqaro Platforma
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              NextOly —{" "}
              <span className="text-blue-600">International Online Olympiad</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg">
              Xalqaro akademik olimpiadalarni tashkil etish va ularda ishtirok
              etish uchun professional va xavfsiz platforma.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2">
                {"Ro'yxatdan o'tish"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a href="#olympiads">
                <Button size="lg" variant="outline">
                  {"Olimpiadalarni ko'rish"}
                </Button>
              </a>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white shadow-2xl">
              <div className="text-center mb-6">
                <div className="text-5xl mb-2">🏆</div>
                <h3 className="text-2xl font-bold">NextOly</h3>
                <p className="text-blue-200">International Olympiad Platform</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{stats ? formatNumber(stats.countries) : "..."}</div>
                  <div className="text-xs text-blue-200">Countries</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats ? formatNumber(stats.students) : "..."}</div>
                  <div className="text-xs text-blue-200">Students</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats ? formatNumber(stats.medals) : "..."}</div>
                  <div className="text-xs text-blue-200">Medals</div>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 rounded-xl bg-white p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">🥇</span>
                <div>
                  <div className="text-xs font-bold">1st Place</div>
                  <div className="text-xs text-gray-500">Mathematics</div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-xl bg-white p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-xs font-bold">+1,240</div>
                  <div className="text-xs text-gray-500">New this month</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          {[
            { icon: Globe, label: "Mamlakatlar", value: stats?.countries },
            { icon: Users, label: "Jami ishtirokchilar", value: stats?.students },
            { icon: Medal, label: "Berilgan medallar", value: stats?.medals },
            { icon: Heart, label: "Ko'ngillilar", value: stats?.volunteers },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <item.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                {item.value != null ? item.value.toLocaleString() + "+" : "..."}
              </div>
              <div className="text-sm text-gray-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
