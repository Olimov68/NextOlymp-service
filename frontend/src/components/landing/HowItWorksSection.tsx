"use client";

import { useI18n } from "@/lib/i18n";
import { UserPlus, BookOpen, Award } from "lucide-react";

const steps = {
  uz: [
    {
      icon: UserPlus,
      title: "Ro'yxatdan o'ting",
      desc: "Platformada bepul ro'yxatdan o'ting va shaxsiy kabinetingizga kiring",
    },
    {
      icon: BookOpen,
      title: "Olimpiadani tanlang",
      desc: "O'zingizga kerakli fan olimpiadasini tanlang va ro'yxatdan o'ting",
    },
    {
      icon: Award,
      title: "Imtihon topshiring",
      desc: "Belgilangan vaqtda imtihon topshiring va sertifikat oling",
    },
  ],
  ru: [
    {
      icon: UserPlus,
      title: "Зарегистрируйтесь",
      desc: "Бесплатно зарегистрируйтесь на платформе и войдите в личный кабинет",
    },
    {
      icon: BookOpen,
      title: "Выберите олимпиаду",
      desc: "Выберите нужную предметную олимпиаду и зарегистрируйтесь",
    },
    {
      icon: Award,
      title: "Сдайте экзамен",
      desc: "Сдайте экзамен в назначенное время и получите сертификат",
    },
  ],
  en: [
    {
      icon: UserPlus,
      title: "Register",
      desc: "Register for free on the platform and access your personal dashboard",
    },
    {
      icon: BookOpen,
      title: "Choose Olympiad",
      desc: "Select the subject olympiad you need and register for it",
    },
    {
      icon: Award,
      title: "Take the Exam",
      desc: "Take the exam at the scheduled time and receive your certificate",
    },
  ],
};

export function HowItWorksSection() {
  const { lang, t } = useI18n();
  const currentSteps = steps[lang] || steps.uz;

  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950 to-indigo-950" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-sm text-sky-300 mb-4">
            {t("howit.badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("howit.title")}
          </h2>
          <p className="text-lg text-blue-200/60 leading-relaxed">
            {t("howit.desc")}
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Dashed connector line (desktop only) */}
          <div className="hidden md:block absolute top-[72px] left-[calc(16.666%+24px)] right-[calc(16.666%+24px)] h-[2px]">
            <div className="w-full h-full border-t-2 border-dashed border-blue-400/30" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {currentSteps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center">
                {/* Step number */}
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg shadow-lg shadow-blue-500/30 mb-6">
                  {i + 1}
                </div>

                {/* Card */}
                <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center hover:bg-white/10 hover:border-blue-400/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex justify-center mb-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/20">
                      <step.icon className="h-7 w-7 text-blue-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-blue-200/50 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
