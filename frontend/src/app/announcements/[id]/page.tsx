"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchAnnouncementItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { ArrowLeft, Megaphone } from "lucide-react";
import Link from "next/link";

export default function AnnouncementDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { t, lang } = useI18n();

  const { data: announcement, isLoading, error } = useQuery({
    queryKey: ["announcement", id],
    queryFn: () => fetchAnnouncementItem(id),
    enabled: !!id,
  });
  const localeMap: Record<string, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };

  return (
    <PublicLayout>
      <div className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Link>

          {isLoading ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
              <p className="text-gray-500">{t("common.loading")}</p>
            </div>
          ) : error || !announcement ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
              <p className="text-gray-500">{t("common.error")}</p>
            </div>
          ) : (
            <article className="rounded-2xl bg-white/5 border border-white/10 p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Megaphone className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(announcement.created_at).toLocaleDateString(localeMap[lang] || "uz-UZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-6">{announcement.title}</h1>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">{announcement.description}</p>
              </div>
            </article>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
