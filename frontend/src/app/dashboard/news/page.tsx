"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchNews } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function DashboardNewsPage() {
  const { t } = useI18n();
  const { data: news, isLoading } = useQuery({ queryKey: ["news"], queryFn: fetchNews });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("dashboard.news")}</h1>

      {isLoading ? (
        <div className="text-gray-400 p-8 text-center">{t("common.loading")}</div>
      ) : (
        <div className="space-y-4">
          {news?.map((item) => (
            <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
          {news?.length === 0 && (
            <div className="text-center text-gray-400 py-12">Yangiliklar mavjud emas</div>
          )}
        </div>
      )}
    </div>
  );
}
