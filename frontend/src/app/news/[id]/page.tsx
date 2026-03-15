"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Newspaper } from "lucide-react";
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

  useEffect(() => {
    api.get(`/news/${id}`)
      .then(res => setItem(res.data?.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50">
        <AnnouncementBar />
        <Header />
      </div>
      <main className="py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <Button variant="ghost" size="sm" className="mb-6 gap-2" onClick={() => router.push("/news")}>
            <ArrowLeft className="h-4 w-4" /> Orqaga
          </Button>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : error || !item ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Newspaper className="h-14 w-14 mb-4 opacity-20" />
              <p className="text-lg font-medium">Yangilik topilmadi</p>
              <Link href="/news"><Button variant="outline" className="mt-4">Barcha yangiliklar</Button></Link>
            </div>
          ) : (
            <article>
              {/* Cover image */}
              {item.cover_image && (
                <div className="rounded-2xl overflow-hidden mb-8 border border-border">
                  <img src={getImageUrl(item.cover_image)!} alt={item.title} className="w-full h-64 md:h-80 object-cover" />
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary">{item.type === "news" ? "Yangilik" : "E'lon"}</Badge>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(item.published_at || item.created_at).toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" })}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{item.title}</h1>

              {/* Excerpt */}
              {item.excerpt && (
                <p className="text-base text-muted-foreground mb-6 border-l-2 border-primary pl-4 italic">{item.excerpt}</p>
              )}

              {/* Body */}
              <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                {item.body}
              </div>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
