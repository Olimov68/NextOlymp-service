"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchNews } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calendar, Newspaper } from "lucide-react";
import Link from "next/link";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1").replace(/\/api\/v1$/, "");

function getImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BACKEND_URL}${url}`;
}

export function NewsSection() {
  const { data: news, isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
  });
  const { t, lang } = useI18n();

  if (isLoading) return null;
  if (!news?.length) return null;

  const localeMap = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };

  return (
    <section id="news" className="relative py-20 overflow-hidden bg-background border-t border-border">
      <div className="pointer-events-none absolute bottom-10 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" aria-hidden />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-4">
            <Newspaper className="h-4 w-4" />
            {t("nav.news")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("news.title")}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">{t("news.desc")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.slice(0, 6).map((n) => {
            const imgUrl = getImageUrl(n.cover_image || n.image);
            return (
              <Link key={n.id} href={`/news/${n.id}`}>
                <Card className="group hover:-translate-y-1 transition-all duration-300 border border-border bg-card backdrop-blur-sm shadow-none rounded-2xl overflow-hidden hover:bg-accent hover:border-green-400/20 cursor-pointer h-full">
                  <div className="relative h-48 bg-muted overflow-hidden">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={n.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                        <Newspaper className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Calendar className="h-3 w-3" />
                      {new Date(n.published_at || n.created_at).toLocaleDateString(localeMap[lang] || "uz-UZ", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{n.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {n.excerpt || n.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                      {t("news.read_more")} <ArrowRight className="h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* View all news link */}
        <div className="text-center mt-10">
          <Link href="/news">
            <button className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors">
              {lang === "ru" ? "Все новости" : lang === "en" ? "All news" : "Barcha yangiliklar"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
