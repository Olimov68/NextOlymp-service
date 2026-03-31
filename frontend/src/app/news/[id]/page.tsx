"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { useI18n } from "@/lib/i18n";
import { translateText } from "@/lib/translate";
import { ArrowLeft, Calendar, Newspaper, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_image: string;
  type: "news" | "announcement";
  status: string;
  published_at: string;
  created_at: string;
}

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "https://nextolymp.uz/api/v1").replace(/\/api\/v1$/, "");

function getImageUrl(url: string) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BACKEND_URL}${url}`;
}

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t, lang } = useI18n();

  // Translated fields
  const [tTitle, setTTitle] = useState("");
  const [tExcerpt, setTExcerpt] = useState("");
  const [tBody, setTBody] = useState("");
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    api.get(`/news/${id}`)
      .then(res => setItem(res.data?.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Auto-translate when lang changes
  useEffect(() => {
    if (!item) return;
    if (lang === "uz") {
      setTTitle(item.title);
      setTExcerpt(item.excerpt || "");
      setTBody(item.body || "");
      return;
    }
    setTranslating(true);
    Promise.all([
      translateText(item.title, "uz", lang),
      item.excerpt ? translateText(item.excerpt, "uz", lang) : Promise.resolve(""),
      item.body ? translateText(item.body, "uz", lang) : Promise.resolve(""),
    ]).then(([title, excerpt, body]) => {
      setTTitle(title);
      setTExcerpt(excerpt);
      setTBody(body);
    }).catch(() => {
      setTTitle(item.title);
      setTExcerpt(item.excerpt || "");
      setTBody(item.body || "");
    }).finally(() => setTranslating(false));
  }, [item, lang]);

  return (
    <PublicLayout>
      <div className="py-10">
        <div className="max-w-3xl mx-auto px-4">
          <button
            onClick={() => router.push("/news")}
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> {t("common.back")}
          </button>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-64 w-full rounded-2xl bg-white/5" />
              <div className="h-8 w-3/4 bg-white/10 rounded" />
              <div className="h-4 w-full bg-white/10 rounded" />
              <div className="h-4 w-5/6 bg-white/10 rounded" />
            </div>
          ) : error || !item ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
              <Newspaper className="h-14 w-14 mb-4 opacity-20" />
              <p className="text-lg font-medium">{t("results.no_results")}</p>
              <Link href="/news" className="mt-4 px-5 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-colors text-sm">
                {t("landing.nav.blog")}
              </Link>
            </div>
          ) : (
            <article>
              {item.cover_image && (
                <div className="rounded-2xl overflow-hidden mb-8 border border-white/10">
                  <img src={getImageUrl(item.cover_image)!} alt={tTitle} className="w-full h-64 md:h-80 object-cover" />
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/20">
                  {item.type === "news" ? t("landing.nav.blog") : "E'lon"}
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(item.published_at || item.created_at).toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" })}
                </span>
                {translating && (
                  <span className="flex items-center gap-1 text-xs text-blue-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {lang === "ru" ? "Перевод..." : "Translating..."}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold mb-4">{tTitle}</h1>

              {tExcerpt && (
                <p className="text-base text-gray-400 mb-6 border-l-2 border-blue-500 pl-4 italic">{tExcerpt}</p>
              )}

              <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
                {tBody}
              </div>
            </article>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
