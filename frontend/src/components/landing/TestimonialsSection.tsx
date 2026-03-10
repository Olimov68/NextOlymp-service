"use client";

import { Quote, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

const testimonials = [
  {
    name: "Aziz Karimov",
    initials: "AK",
    color: "from-blue-500 to-cyan-600",
    role: {
      uz: "11-sinf o'quvchisi",
      ru: "Ученик 11 класса",
      en: "11th Grade Student",
    },
    country: "Uzbekistan",
    quote: {
      uz: "NextOly platformasi orqali xalqaro olimpiadalarda qatnashish juda qulay. Natijalar tez chiqadi va sertifikatlarni onlayn olish mumkin.",
      ru: "Участвовать в международных олимпиадах через платформу NextOly очень удобно. Результаты выходят быстро, а сертификаты можно получить онлайн.",
      en: "Participating in international olympiads through the NextOly platform is very convenient. Results come out quickly and certificates can be obtained online.",
    },
  },
  {
    name: "Malika Rahimova",
    initials: "MR",
    color: "from-purple-500 to-pink-600",
    role: {
      uz: "9-sinf o'quvchisi",
      ru: "Ученица 9 класса",
      en: "9th Grade Student",
    },
    country: "Uzbekistan",
    quote: {
      uz: "Matematika olimpiadasida oltin medal oldim! Platforma juda zamonaviy va ishlatish oson.",
      ru: "Я получила золотую медаль на олимпиаде по математике! Платформа очень современная и простая в использовании.",
      en: "I won a gold medal in the Mathematics Olympiad! The platform is very modern and easy to use.",
    },
  },
  {
    name: "Sardor Toshmatov",
    initials: "ST",
    color: "from-amber-500 to-orange-600",
    role: {
      uz: "10-sinf o'quvchisi",
      ru: "Ученик 10 класса",
      en: "10th Grade Student",
    },
    country: "Uzbekistan",
    quote: {
      uz: "AI monitoring tizimi juda adolatli imtihon o'tkazishni ta'minlaydi. Men fizika bo'yicha kumush medal oldim.",
      ru: "Система AI-мониторинга обеспечивает очень справедливое проведение экзаменов. Я получил серебряную медаль по физике.",
      en: "The AI monitoring system ensures very fair exam conduct. I received a silver medal in Physics.",
    },
  },
];

export function TestimonialsSection() {
  const { lang, t } = useI18n();

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-b from-gray-950 to-blue-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 text-sm text-yellow-300 mb-4">
            {t("testimonials.badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("testimonials.title")}
          </h2>
          <p className="text-blue-200/50 max-w-md mx-auto">
            {t("testimonials.desc")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((item) => (
            <Card
              key={item.name}
              className="group hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden"
            >
              <CardContent className="p-6">
                <div className="mb-4">
                  <Quote className="h-8 w-8 text-blue-400/40" />
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                <p className="text-sm text-blue-200/70 leading-relaxed mb-6">
                  &ldquo;{item.quote[lang]}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${item.color} text-white font-bold text-sm shadow-lg`}
                  >
                    {item.initials}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {item.name}
                    </h4>
                    <p className="text-xs text-blue-400">
                      {item.role[lang]} &middot; {item.country}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
