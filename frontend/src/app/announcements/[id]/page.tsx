"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchAnnouncements } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Megaphone } from "lucide-react";
import Link from "next/link";

export default function AnnouncementDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { t, lang } = useI18n();

  const { data: announcements, isLoading, error } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  });

  const announcement = announcements?.find((a) => a.id === id);
  const localeMap: Record<string, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            href="/#announcements"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Link>

          {isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center">
              <p className="text-blue-200/50">{t("common.loading")}</p>
            </div>
          ) : error || !announcement ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center">
              <p className="text-blue-200/50">{t("common.error")}</p>
            </div>
          ) : (
            <article className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-400/20">
                  <Megaphone className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-sm text-blue-300/50">
                  {new Date(announcement.createdAt).toLocaleDateString(localeMap[lang] || "uz-UZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">{announcement.title}</h1>
              <div className="prose prose-invert prose-blue max-w-none">
                <p className="text-blue-100/70 text-lg leading-relaxed whitespace-pre-wrap">{announcement.description}</p>
              </div>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
