"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchNewsItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";

export default function NewsDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { t, lang } = useI18n();

  const { data: news, isLoading, error } = useQuery({
    queryKey: ["news", id],
    queryFn: () => fetchNewsItem(id),
    enabled: !!id,
  });

  const localeMap: Record<string, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            href="/#news"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Link>

          {isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center">
              <p className="text-blue-200/50">{t("common.loading")}</p>
            </div>
          ) : error || !news ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center">
              <p className="text-blue-200/50">{t("common.error")}</p>
            </div>
          ) : (
            <article className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 md:p-12">
              <div className="flex items-center gap-2 text-sm text-blue-300/50 mb-6">
                <Calendar className="h-4 w-4" />
                {new Date(news.createdAt).toLocaleDateString(localeMap[lang] || "uz-UZ", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">{news.title}</h1>
              {news.image && (
                <div className="h-64 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 mb-8" />
              )}
              <div className="prose prose-invert prose-blue max-w-none">
                <p className="text-blue-100/70 text-lg leading-relaxed whitespace-pre-wrap">{news.description}</p>
              </div>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
