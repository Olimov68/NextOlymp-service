"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOlympiads } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Atom, FlaskConical, Leaf, Code } from "lucide-react";

const subjectIcons: Record<string, React.ReactNode> = {
  Mathematics: <BookOpen className="h-6 w-6" />,
  Physics: <Atom className="h-6 w-6" />,
  Chemistry: <FlaskConical className="h-6 w-6" />,
  Biology: <Leaf className="h-6 w-6" />,
  Informatics: <Code className="h-6 w-6" />,
};

const subjectGradients: Record<string, string> = {
  Mathematics: "from-blue-500/20 to-indigo-500/20 border-blue-400/20 text-blue-400",
  Physics: "from-purple-500/20 to-pink-500/20 border-purple-400/20 text-purple-400",
  Chemistry: "from-green-500/20 to-emerald-500/20 border-green-400/20 text-green-400",
  Biology: "from-orange-500/20 to-amber-500/20 border-orange-400/20 text-orange-400",
  Informatics: "from-pink-500/20 to-rose-500/20 border-pink-400/20 text-pink-400",
};

export function OlympiadsSection() {
  const { data: olympiads, isLoading } = useQuery({
    queryKey: ["olympiads"],
    queryFn: fetchOlympiads,
  });
  const { t } = useI18n();

  return (
    <section id="olympiads" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 to-blue-950" />
      <div className="absolute inset-0">
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 backdrop-blur-sm px-4 py-1.5 text-sm text-amber-300 mb-4">
            🏆 {t("nav.olympiads")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("olympiads.title")}</h2>
          <p className="text-blue-200/50 max-w-md mx-auto">{t("olympiads.desc")}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
                <div className="h-12 w-12 rounded-xl bg-white/10 mb-4" />
                <div className="h-6 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-4 bg-white/10 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {olympiads?.map((o) => (
              <Card key={o.id} className="group hover:-translate-y-1 transition-all duration-300 border border-white/10 bg-white/5 backdrop-blur-sm shadow-none rounded-2xl hover:bg-white/10 hover:border-blue-400/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br border ${subjectGradients[o.subject] || "from-gray-500/20 to-gray-500/20 border-gray-400/20 text-gray-400"}`}>
                      {subjectIcons[o.subject] || <BookOpen className="h-6 w-6" />}
                    </div>
                    <Badge variant="outline" className={o.price === 0 ? "border-green-400/30 text-green-400 bg-green-500/10" : "border-orange-400/30 text-orange-400 bg-orange-500/10"}>
                      {o.price === 0 ? t("olympiads.free") : t("olympiads.paid")}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-3 text-white">{o.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-blue-200/50">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {t("olympiads.subject")}: {o.subject}
                    </div>
                    {o.startDate && (
                      <div className="flex items-center gap-2">
                        📅 {t("olympiads.date")}: {new Date(o.startDate).toLocaleDateString("uz-UZ")}
                        {o.endDate && ` - ${new Date(o.endDate).toLocaleDateString("uz-UZ")}`}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize border-white/10 text-blue-300/60">
                        {o.status === "active" ? t("olympiads.status.active") : o.status === "upcoming" ? t("olympiads.status.upcoming") : t("olympiads.status.completed")}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
