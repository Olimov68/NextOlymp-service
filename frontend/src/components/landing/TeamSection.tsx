"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

const team = [
  {
    name: "Asilbek Olimov",
    role: { uz: "Asoschi va CEO", ru: "Основатель и CEO", en: "Founder & CEO" },
    desc: { uz: "NextOly platformasini asos solgan va boshqaruvchi.", ru: "Основал и управляет платформой NextOly.", en: "Founded and leads the NextOly platform." },
    initials: "AO",
    color: "from-blue-500 to-indigo-600",
  },
  {
    name: "Shahzod Chorshanbiyev",
    role: { uz: "Hammuassis", ru: "Сооснователь", en: "Co-Founder" },
    desc: { uz: "Platformaning strategik rivojlanishida yetakchi.", ru: "Лидер стратегического развития платформы.", en: "Leading the strategic development of the platform." },
    initials: "SC",
    color: "from-indigo-500 to-purple-600",
  },
  {
    name: "Shahboz Toshqulov",
    role: { uz: "Akademik direktor", ru: "Академический директор", en: "Academic Director" },
    desc: { uz: "Olimpiada savollarini tayyorlash va akademik sifatni nazorat qilish.", ru: "Подготовка олимпиадных задач и контроль качества.", en: "Prepares olympiad problems and oversees academic quality." },
    initials: "ST",
    color: "from-purple-500 to-pink-600",
  },
  {
    name: "Sanjar Abduraxmonov",
    role: { uz: "Loyiha menejeri", ru: "Проектный менеджер", en: "Project Manager" },
    desc: { uz: "Loyihani rejalashtirish va jarayonlarni boshqarish.", ru: "Планирование проекта и управление процессами.", en: "Project planning and process management." },
    initials: "SA",
    color: "from-teal-500 to-cyan-600",
  },
  {
    name: "Shahriyor Toshqulov",
    role: { uz: "Texnik direktor", ru: "Технический директор", en: "CTO" },
    desc: { uz: "Platformaning texnik infratuzilmasini boshqaradi.", ru: "Управляет технической инфраструктурой платформы.", en: "Manages the platform's technical infrastructure." },
    initials: "ST",
    color: "from-amber-500 to-orange-600",
  },
];

export function TeamSection() {
  const { lang, t } = useI18n();
  return (
    <section id="team" className="py-20 bg-gradient-to-b from-indigo-950 to-blue-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300 mb-4">
            {t("nav.team")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("team.title") || "Bizning Jamoa"}</h2>
          <p className="text-blue-200/50 max-w-md mx-auto">
            {t("team.desc") || "NextOly platformasi ortidagi jamoamiz bilan tanishing"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {team.map((member) => (
            <Card key={member.name} className="group hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${member.color} text-white font-bold text-lg shadow-lg`}>
                    {member.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{member.name}</h3>
                    <p className="text-sm font-medium text-blue-400">{member.role[lang]}</p>
                  </div>
                </div>
                <p className="text-sm text-blue-200/50 leading-relaxed">{member.desc[lang]}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
