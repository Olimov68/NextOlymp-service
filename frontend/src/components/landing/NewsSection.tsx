"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchNews } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calendar } from "lucide-react";

export function NewsSection() {
  const { data: news, isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
  });
  const { t } = useI18n();

  if (isLoading) return null;
  if (!news?.length) return null;

  return (
    <section id="news" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 to-gray-950" />
      <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-green-500/5 rounded-full blur-3xl" />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-500/10 backdrop-blur-sm px-4 py-1.5 text-sm text-green-300 mb-4">
            📰 {t("nav.news")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("news.title")}</h2>
          <p className="text-blue-200/50 max-w-md mx-auto">{t("news.desc")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((n) => (
            <Card key={n.id} className="group hover:-translate-y-1 transition-all duration-300 border border-white/10 bg-white/5 backdrop-blur-sm shadow-none rounded-2xl overflow-hidden hover:bg-white/10 hover:border-green-400/20">
              {n.image && (
                <div className="h-48 bg-gradient-to-br from-blue-500/10 to-indigo-500/10" />
              )}
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-xs text-blue-300/40 mb-3">
                  <Calendar className="h-3 w-3" />
                  {new Date(n.createdAt).toLocaleDateString("uz-UZ", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <h3 className="font-semibold text-white mb-2">{n.title}</h3>
                <p className="text-sm text-blue-200/50 line-clamp-3">{n.description}</p>
                <button className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                  {t("news.read_more")} <ArrowRight className="h-3 w-3" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
