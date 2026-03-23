"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { useI18n } from "@/lib/i18n";
import { translateText } from "@/lib/translate";
import { Calendar, Search, Newspaper, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string;
  type: "news" | "announcement";
  status: string;
  published_at: string;
  created_at: string;
}

interface TranslatedNews extends NewsItem {
  _title: string;
  _excerpt: string;
}

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "https://nextolymp.uz/api/v1").replace(/\/api\/v1$/, "");

function getImageUrl(url: string) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BACKEND_URL}${url}`;
}

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [translated, setTranslated] = useState<TranslatedNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [search, setSearch] = useState("");
  const { t, lang } = useI18n();

  useEffect(() => {
    api.get("/news?page=1&page_size=50")
      .then(res => {
        const d = res.data?.data;
        const arr = Array.isArray(d) ? d : d?.data || [];
        setItems(arr);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // Auto-translate when language changes
  const doTranslate = useCallback(async () => {
    if (lang === "uz" || items.length === 0) {
      setTranslated(items.map(i => ({ ...i, _title: i.title, _excerpt: i.excerpt })));
      return;
    }
    setTranslating(true);
    try {
      const results = await Promise.all(
        items.map(async (item) => {
          const [_title, _excerpt] = await Promise.all([
            translateText(item.title, "uz", lang),
            item.excerpt ? translateText(item.excerpt, "uz", lang) : Promise.resolve(""),
          ]);
          return { ...item, _title, _excerpt };
        })
      );
      setTranslated(results);
    } catch {
      setTranslated(items.map(i => ({ ...i, _title: i.title, _excerpt: i.excerpt })));
    }
    setTranslating(false);
  }, [items, lang]);

  useEffect(() => { doTranslate(); }, [doTranslate]);

  const filtered = translated.filter(i =>
    !search || i._title.toLowerCase().includes(search.toLowerCase()) || i._excerpt?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PublicLayout>
      {/* Page header */}
      <section className="py-14 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-sm text-blue-300 mb-5">
            <Newspaper className="h-4 w-4" />
            {t("landing.nav.blog")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("news.title")}</h1>
          <p className="text-gray-400 max-w-lg mx-auto">{t("news.desc")}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Search + translating indicator */}
          <div className="flex items-center gap-4 mb-10">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                placeholder={`${t("common.search")}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            {translating && (
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                {lang === "ru" ? "Перевод..." : lang === "en" ? "Translating..." : "Tarjima..."}
              </div>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden animate-pulse">
                  <div className="h-48 bg-white/5" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-20 bg-white/10 rounded" />
                    <div className="h-5 w-full bg-white/10 rounded" />
                    <div className="h-4 w-3/4 bg-white/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
              <Newspaper className="h-14 w-14 mb-4 opacity-20" />
              <p className="text-lg font-medium">{t("results.no_results")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(item => {
                const imgUrl = getImageUrl(item.cover_image);
                return (
                  <Link key={item.id} href={`/news/${item.id}`} className="group rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 flex flex-col">
                    <div className="relative h-48 bg-white/5 overflow-hidden">
                      {imgUrl ? (
                        <img src={imgUrl} alt={item._title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="h-12 w-12 text-gray-700" />
                        </div>
                      )}
                      <span className="absolute top-3 left-3 text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/20">
                        {item.type === "news" ? t("landing.nav.blog") : "E'lon"}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(item.published_at || item.created_at).toLocaleDateString("uz-UZ")}</span>
                      </div>
                      <h3 className="font-bold text-base line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">{item._title}</h3>
                      {item._excerpt && <p className="text-sm text-gray-400 line-clamp-2 flex-1 mb-4">{item._excerpt}</p>}
                      <div className="inline-flex items-center gap-2 text-sm text-blue-400 font-medium">
                        {t("news.read_more")}
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
