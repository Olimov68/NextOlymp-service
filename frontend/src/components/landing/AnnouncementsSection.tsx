"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAnnouncements } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

export function AnnouncementsSection() {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  });
  const { t } = useI18n();

  if (isLoading) return null;
  if (!announcements?.length) return null;

  return (
    <section id="announcements" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950 to-indigo-950" />
      <div className="absolute top-10 left-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 backdrop-blur-sm px-4 py-1.5 text-sm text-blue-300 mb-4">
            📢 {t("nav.announcements")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("announcements.title")}</h2>
          <p className="text-blue-200/50 max-w-md mx-auto">{t("announcements.desc")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map((a) => (
            <Card key={a.id} className="group hover:-translate-y-1 transition-all duration-300 border border-white/10 bg-white/5 backdrop-blur-sm shadow-none rounded-2xl hover:bg-white/10 hover:border-blue-400/20">
              <CardContent className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-400/20 mb-4">
                  <Megaphone className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{a.title}</h3>
                <p className="text-sm text-blue-200/50 line-clamp-3">{a.description}</p>
                <div className="mt-4 text-xs text-blue-300/30">
                  {new Date(a.createdAt).toLocaleDateString("uz-UZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
