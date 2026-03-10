"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchNews } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calendar } from "lucide-react";

export function NewsSection() {
  const { data: news, isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
  });

  if (isLoading) return null;
  if (!news?.length) return null;

  return (
    <section id="news" className="py-20 bg-gray-50/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-sm text-green-700 mb-4">
            📰 News
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{"So'nggi Yangiliklar"}</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            NextOly platformasidagi eng oxirgi yangiliklar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((n) => (
            <Card key={n.id} className="hover:shadow-lg transition-shadow border-0 shadow-sm overflow-hidden">
              {n.image && (
                <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200" />
              )}
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <Calendar className="h-3 w-3" />
                  {new Date(n.createdAt).toLocaleDateString("uz-UZ", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{n.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-3">{n.description}</p>
                <button className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                  {"Batafsil o'qish"} <ArrowRight className="h-3 w-3" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
