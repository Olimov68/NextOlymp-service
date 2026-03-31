"use client";

import { Brain, Briefcase, Users, Target, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const benefits = [
  {
    icon: Brain,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-500",
    title: {
      uz: "Intellektual yuksalish",
      ru: "Интеллектуальный рост",
      en: "Intellectual Growth",
    },
    points: {
      uz: [
        "Chuqurlashtirilgan bilim olish",
        "Murakkab va nostandart savollar",
        "Kreativ fikrlash ko'nikmasi",
        "Algoritmik yondashuv va problem solving",
      ],
      ru: [
        "Углублённые знания",
        "Сложные нестандартные задачи",
        "Навыки креативного мышления",
        "Алгоритмический подход и решение проблем",
      ],
      en: [
        "Deep knowledge acquisition",
        "Complex non-standard problems",
        "Creative thinking skills",
        "Algorithmic approach & problem solving",
      ],
    },
  },
  {
    icon: Briefcase,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    iconColor: "text-purple-500",
    title: {
      uz: "Karyera imkoniyatlari",
      ru: "Карьерные возможности",
      en: "Career Opportunities",
    },
    points: {
      uz: [
        "CV va portfolio uchun kuchli yutuq",
        "Universitetga kirish uchun ustunlik",
        "Grant va stipendiya imkoniyatlari",
        "Ish beruvchilar uchun ajralib turish",
      ],
      ru: [
        "Сильное достижение для CV и портфолио",
        "Преимущество при поступлении",
        "Возможности грантов и стипендий",
        "Выделение среди работодателей",
      ],
      en: [
        "Strong CV & portfolio achievement",
        "University admission advantage",
        "Grant & scholarship opportunities",
        "Stand out for employers",
      ],
    },
  },
  {
    icon: Users,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    title: {
      uz: "Ijtimoiy foyda",
      ru: "Социальные преимущества",
      en: "Social Benefits",
    },
    points: {
      uz: [
        "Networking va foydali tanishuvlar",
        "Kuchli jamoa topish imkoniyati",
        "Stressga chidamlilik oshadi",
        "Bosim ostida ishlash ko'nikmasi",
      ],
      ru: [
        "Нетворкинг и полезные знакомства",
        "Возможность найти сильную команду",
        "Повышение стрессоустойчивости",
        "Навыки работы под давлением",
      ],
      en: [
        "Networking & useful connections",
        "Finding a strong team",
        "Increased stress resilience",
        "Skills working under pressure",
      ],
    },
  },
  {
    icon: Target,
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500/10",
    iconColor: "text-orange-500",
    title: {
      uz: "O'z-o'zini rivojlantirish",
      ru: "Саморазвитие",
      en: "Self-Development",
    },
    points: {
      uz: [
        "O'z bilim darajasini sinash",
        "Kuchli va sust tomonlarini bilish",
        "Xalqaro darajada o'zini baholash",
        "Kelajak yo'nalishini aniqlash",
      ],
      ru: [
        "Проверка уровня знаний",
        "Определение сильных и слабых сторон",
        "Оценка на международном уровне",
        "Определение будущего направления",
      ],
      en: [
        "Test your knowledge level",
        "Know your strengths & weaknesses",
        "International self-assessment",
        "Define your future direction",
      ],
    },
  },
];

const sectionTitle = {
  uz: "Nima uchun olimpiadada qatnashish kerak?",
  ru: "Зачем участвовать в олимпиадах?",
  en: "Why participate in olympiads?",
};

const sectionDesc = {
  uz: "Olimpiadalar — bu nafaqat musobaqa, balki o'z imkoniyatlaringizni kashf etish va kelajagingizni shakllantirish uchun noyob platforma",
  ru: "Олимпиады — это не просто соревнование, а уникальная платформа для раскрытия потенциала и формирования будущего",
  en: "Olympiads are not just competitions, but a unique platform to discover your potential and shape your future",
};

export function BenefitsSection() {
  const { lang } = useI18n();

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-4">
            <Target className="h-4 w-4" />
            {lang === "ru" ? "Преимущества" : lang === "en" ? "Benefits" : "Afzalliklar"}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {sectionTitle[lang] || sectionTitle.uz}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {sectionDesc[lang] || sectionDesc.uz}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center rounded-xl ${benefit.bgColor} p-3 mb-5`}>
                <benefit.icon className={`h-6 w-6 ${benefit.iconColor}`} />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {benefit.title[lang] || benefit.title.uz}
              </h3>

              {/* Points */}
              <ul className="space-y-2.5">
                {(benefit.points[lang] || benefit.points.uz).map((point, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-gradient-to-r ${benefit.color}`} />
                    {point}
                  </li>
                ))}
              </ul>

              {/* Decorative gradient line at top */}
              <div className={`absolute top-0 left-6 right-6 h-0.5 rounded-full bg-gradient-to-r ${benefit.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          <a href="#olympiads">
            <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 border-0">
              {lang === "ru" ? "Смотреть олимпиады" : lang === "en" ? "View Olympiads" : "Olimpiadalarni ko'rish"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
          <Link href="/olympiads">
            <Button size="lg" variant="outline" className="gap-2">
              {lang === "ru" ? "Смотреть тесты" : lang === "en" ? "View Tests" : "Testlarni ko'rish"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
