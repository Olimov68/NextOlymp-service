"use client";

import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

const organizersData = {
  uz: [
    { name: "NextOly Foundation", desc: "Xalqaro olimpiadalar tashkilotchisi va asosiy platforma." },
    { name: "O'zbekiston Matematika Jamiyati", desc: "Matematika fani bo'yicha olimpiadalar hamkori." },
    { name: "Central Asian Academic Council", desc: "Markaziy Osiyo mintaqasidagi akademik hamkorlik kengashi." },
  ],
  ru: [
    { name: "NextOly Foundation", desc: "Организатор международных олимпиад и основная платформа." },
    { name: "Математическое общество Узбекистана", desc: "Партнёр по олимпиадам по математике." },
    { name: "Central Asian Academic Council", desc: "Совет академического сотрудничества Центральной Азии." },
  ],
  en: [
    { name: "NextOly Foundation", desc: "International olympiad organizer and main platform." },
    { name: "Uzbekistan Mathematical Society", desc: "Partner for mathematics olympiads." },
    { name: "Central Asian Academic Council", desc: "Academic cooperation council for Central Asia." },
  ],
};

export function OrganizersSection() {
  const { lang, t } = useI18n();
  const organizers = organizersData[lang] || organizersData.uz;

  return (
    <section id="organizers" className="py-20 bg-gradient-to-b from-indigo-950 to-blue-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300 mb-4">
            {t("nav.organizers")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("nav.organizers")}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {organizers.map((org) => (
            <Card key={org.name} className="group hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 border border-white/10 bg-white/5 backdrop-blur-sm text-center rounded-2xl">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-400/20">
                  <Building2 className="h-7 w-7 text-indigo-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{org.name}</h3>
                <p className="text-sm text-blue-200/50">{org.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
