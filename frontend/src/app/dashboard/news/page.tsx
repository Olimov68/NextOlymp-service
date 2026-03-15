"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Calendar, Newspaper, Search, ArrowRight } from "lucide-react";
import { listNews } from "@/lib/user-api";

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string;
  type: "news" | "announcement";
  published_at: string;
  created_at: string;
}

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1").replace(/\/api\/v1$/, "");
function getImageUrl(url: string) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BACKEND_URL}${url}`;
}

export default function DashboardNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listNews({ page: 1, page_size: 50 })
      .then(data => {
        const arr = Array.isArray(data) ? data : (data as any)?.data || [];
        setItems(arr);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(i =>
    !search || i.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Yangiliklar</h1>
        <p className="text-sm text-muted-foreground mt-1">So&apos;nggi yangiliklar va e&apos;lonlar</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4 flex gap-4">
              <Skeleton className="h-20 w-28 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <Newspaper className="h-12 w-12 mb-3 opacity-20" />
          <p>Yangiliklar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(item => {
            const img = getImageUrl(item.cover_image);
            return (
              <div key={item.id} className="group rounded-xl border border-border bg-card p-4 flex gap-4 hover:shadow-md transition-all">
                {/* Thumbnail */}
                <div className="h-20 w-28 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {img ? (
                    <img src={img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {item.type === "news" ? "Yangilik" : "E'lon"}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.published_at || item.created_at).toLocaleDateString("uz-UZ")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                  {item.excerpt && <p className="text-sm text-muted-foreground line-clamp-1 flex-1">{item.excerpt}</p>}
                  <Link href={`/news/${item.id}`} className="mt-2 self-start">
                    <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
                      Batafsil <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
