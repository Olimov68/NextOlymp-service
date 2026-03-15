"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Search, Newspaper, ArrowRight } from "lucide-react";
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

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "https://nextolymp.uz/api/v1").replace(/\/api\/v1$/, "");

function getImageUrl(url: string) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BACKEND_URL}${url}`;
}

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const filtered = items.filter(i =>
    !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.excerpt?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50">
        <AnnouncementBar />
        <Header />
      </div>
      <main>
        {/* Page header */}
        <section className="py-14 border-b border-border bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-5">
              <Newspaper className="h-4 w-4" />
              Yangiliklar
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">So&apos;nggi yangiliklar</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">Olimpiadalar, musobaqalar va platforma yangiliklari</p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Search */}
            <div className="relative max-w-md mb-10">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Yangilik qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-5 space-y-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-9 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Newspaper className="h-14 w-14 mb-4 opacity-20" />
                <p className="text-lg font-medium">Yangiliklar topilmadi</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(item => {
                  const imgUrl = getImageUrl(item.cover_image);
                  return (
                    <div key={item.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
                      {/* Image */}
                      <div className="relative h-48 bg-muted overflow-hidden">
                        {imgUrl ? (
                          <img src={imgUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Newspaper className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                        <Badge className="absolute top-3 left-3 text-xs" variant="secondary">
                          {item.type === "news" ? "Yangilik" : "E'lon"}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(item.published_at || item.created_at).toLocaleDateString("uz-UZ")}</span>
                        </div>
                        <h3 className="font-bold text-foreground text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                        {item.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-4">{item.excerpt}</p>}
                        <Link href={`/news/${item.id}`}>
                          <Button variant="outline" size="sm" className="gap-2 w-full group/btn">
                            Batafsil
                            <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
