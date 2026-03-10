"use client";

import { useI18n, type Lang } from "@/lib/i18n";
import { Shield, Brain, Zap, FileCheck, Monitor, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: Record<Lang, string>;
  desc: Record<Lang, string>;
}

const features: Feature[] = [
  {
    icon: Shield,
    title: {
      uz: "AI asosida monitoring",
      ru: "Мониторинг на базе ИИ",
      en: "AI-Based Monitoring",
    },
    desc: {
      uz: "Sun'iy intellekt yordamida imtihon jarayonini real vaqtda kuzatish va kuchli xavfsizlik tizimi.",
      ru: "Контроль экзаменационного процесса в реальном времени с помощью искусственного интеллекта и надёжная система безопасности.",
      en: "Real-time exam process monitoring powered by artificial intelligence and a robust security system.",
    },
  },
  {
    icon: Brain,
    title: {
      uz: "Zamonaviy test tizimi",
      ru: "Современная система тестов",
      en: "Smart Testing System",
    },
    desc: {
      uz: "Interaktiv savollar, turli xil savol formatlari va intellektual baholash tizimi.",
      ru: "Интерактивные вопросы, различные форматы заданий и интеллектуальная система оценивания.",
      en: "Interactive questions, diverse question formats, and an intelligent grading system.",
    },
  },
  {
    icon: Zap,
    title: {
      uz: "Tezkor natijalar",
      ru: "Быстрые результаты",
      en: "Instant Results",
    },
    desc: {
      uz: "Imtihon yakunlangandan so'ng darhol natijalar va batafsil statistika.",
      ru: "Мгновенные результаты и подробная статистика сразу после завершения экзамена.",
      en: "Immediate results and detailed statistics right after the exam ends.",
    },
  },
  {
    icon: FileCheck,
    title: {
      uz: "Raqamli sertifikat",
      ru: "Цифровой сертификат",
      en: "Digital Certificate",
    },
    desc: {
      uz: "Olimpiada natijalari asosida PDF formatda raqamli sertifikatni yuklab olish imkoniyati.",
      ru: "Возможность скачать цифровой сертификат в формате PDF на основе результатов олимпиады.",
      en: "Download a PDF digital certificate based on your olympiad results.",
    },
  },
  {
    icon: Monitor,
    title: {
      uz: "To'liq ekranli imtihon",
      ru: "Полноэкранный экзамен",
      en: "Fullscreen Exam Mode",
    },
    desc: {
      uz: "Imtihon paytida to'liq ekran rejimi majburiy bo'lib, maksimal diqqatni ta'minlaydi.",
      ru: "Во время экзамена активируется обязательный полноэкранный режим для максимальной концентрации.",
      en: "Mandatory fullscreen mode during exams ensures maximum focus and concentration.",
    },
  },
  {
    icon: Lock,
    title: {
      uz: "Anti-screenshot himoya",
      ru: "Защита от скриншотов",
      en: "Anti-Screenshot Protection",
    },
    desc: {
      uz: "Ekrandan nusxa olish, skrinshot va boshqa ruxsatsiz harakatlar to'liq bloklanadi.",
      ru: "Копирование экрана, скриншоты и другие несанкционированные действия полностью блокируются.",
      en: "Screen capture, screenshots, and other unauthorized actions are fully blocked.",
    },
  },
];

export function FeaturesSection() {
  const { t, lang } = useI18n();

  return (
    <section id="features" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 to-blue-950" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 backdrop-blur-sm px-5 py-2 text-sm text-sky-300 mb-6">
            <Zap className="h-4 w-4" />
            {t("features.badge")}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            {t("features.title")}
          </h2>
          <p className="text-lg text-blue-200/60 leading-relaxed">
            {t("features.desc")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 hover:bg-white/10 hover:border-blue-400/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/20 mb-5 group-hover:from-blue-500/30 group-hover:to-indigo-500/30 transition-all duration-300">
                <feature.icon className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-base">
                {feature.title[lang]}
              </h3>
              <p className="text-sm text-blue-200/50 leading-relaxed">
                {feature.desc[lang]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
