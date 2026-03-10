"use client";

import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Shield, Eye, Monitor, Ban, Camera, Zap, Layout, CreditCard, ArrowRight, Info } from "lucide-react";
import Link from "next/link";

const features = {
  uz: [
    { icon: Eye, title: "AI orqali nazorat va tekshiruv", desc: "Sun'iy intellekt yordamida imtihon jarayonini to'liq nazorat qilish" },
    { icon: Shield, title: "Kuchli xavfsizlik tizimi", desc: "Ko'p bosqichli himoya va shifrlangan ma'lumotlar uzatish" },
    { icon: Monitor, title: "Fullscreen majburiy imtihon muhiti", desc: "Imtihon paytida to'liq ekran rejimida ishlash majburiy" },
    { icon: Ban, title: "Ekrandan chiqib ketishni cheklash", desc: "Boshqa dastur yoki sahifaga o'tishga ruxsat berilmaydi" },
    { icon: Camera, title: "Skrinshot va nusxa olishga qarshi himoya", desc: "Ruxsatsiz nusxa olish va ekran suratiga olish bloklanadi" },
    { icon: Zap, title: "Tezkor va barqaror ishlash", desc: "Yuqori tezlikda yuklanish va barqaror server infratuzilmasi" },
    { icon: Layout, title: "Qulay va tushunarli interfeys", desc: "Foydalanuvchi uchun oddiy va intuitiv dizayn" },
    { icon: CreditCard, title: "Qulay online to'lov usullari", desc: "Turli to'lov usullari orqali oson va xavfsiz to'lov" },
  ],
  ru: [
    { icon: Eye, title: "Контроль и проверка с помощью ИИ", desc: "Полный контроль процесса экзамена с помощью искусственного интеллекта" },
    { icon: Shield, title: "Мощная система безопасности", desc: "Многоуровневая защита и зашифрованная передача данных" },
    { icon: Monitor, title: "Обязательный полноэкранный режим", desc: "Во время экзамена обязателен полноэкранный режим" },
    { icon: Ban, title: "Ограничение выхода из экрана", desc: "Переход к другим приложениям или страницам запрещён" },
    { icon: Camera, title: "Защита от скриншотов и копирования", desc: "Несанкционированное копирование и снимки экрана блокируются" },
    { icon: Zap, title: "Быстрая и стабильная работа", desc: "Высокая скорость загрузки и стабильная серверная инфраструктура" },
    { icon: Layout, title: "Удобный и понятный интерфейс", desc: "Простой и интуитивный дизайн для пользователя" },
    { icon: CreditCard, title: "Удобные способы онлайн-оплаты", desc: "Различные способы оплаты для безопасного и удобного платежа" },
  ],
  en: [
    { icon: Eye, title: "AI-powered monitoring & verification", desc: "Full exam process monitoring using artificial intelligence" },
    { icon: Shield, title: "Strong security system", desc: "Multi-layer protection and encrypted data transmission" },
    { icon: Monitor, title: "Mandatory fullscreen exam mode", desc: "Fullscreen mode is required during the examination" },
    { icon: Ban, title: "Screen exit restriction", desc: "Switching to other apps or pages is not allowed" },
    { icon: Camera, title: "Anti-screenshot & copy protection", desc: "Unauthorized copying and screen capture are blocked" },
    { icon: Zap, title: "Fast and stable performance", desc: "High loading speed and stable server infrastructure" },
    { icon: Layout, title: "User-friendly interface", desc: "Simple and intuitive design for users" },
    { icon: CreditCard, title: "Convenient online payment methods", desc: "Various payment methods for safe and easy payment" },
  ],
};

const titles = {
  uz: { heading: "Milliy sertifikat imtihonini zamonaviy va xavfsiz platformada topshiring", desc: "Sun'iy intellekt yordamida nazorat qilinadigan, mukammal himoyalangan va foydalanuvchi uchun qulay yaratilgan platformamiz orqali imtihonlarni ishonchli tarzda topshiring. Tizimda xavfsizlik, adolat va qulaylik birinchi o'rinda turadi." },
  ru: { heading: "Сдавайте экзамен на национальный сертификат на современной и безопасной платформе", desc: "Сдавайте экзамены надёжно через нашу платформу, контролируемую искусственным интеллектом, идеально защищённую и удобную для пользователей. Безопасность, справедливость и удобство — наши приоритеты." },
  en: { heading: "Take the national certificate exam on a modern and secure platform", desc: "Take exams reliably through our AI-monitored, perfectly protected and user-friendly platform. Security, fairness and convenience are our top priorities." },
};

export function CertificateSection() {
  const { lang } = useI18n();
  const currentFeatures = features[lang] || features.uz;
  const currentTitles = titles[lang] || titles.uz;

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 backdrop-blur-sm px-5 py-2 text-sm text-blue-300 mb-6">
            <Shield className="h-4 w-4" />
            {lang === "uz" ? "Milliy Sertifikat" : lang === "ru" ? "Национальный сертификат" : "National Certificate"}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            {currentTitles.heading}
          </h2>
          <p className="text-lg text-blue-200/60 leading-relaxed">
            {currentTitles.desc}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14 max-w-6xl mx-auto">
          {currentFeatures.map((feature, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:bg-white/10 hover:border-blue-400/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/20 mb-4">
                <feature.icon className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-sm">{feature.title}</h3>
              <p className="text-xs text-blue-200/50 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 border-0 gap-2 px-8">
              {lang === "uz" ? "Imtihonni boshlash" : lang === "ru" ? "Начать экзамен" : "Start Exam"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm gap-2 px-8">
            <Info className="h-4 w-4" />
            {lang === "uz" ? "Batafsil ma'lumot" : lang === "ru" ? "Подробнее" : "Learn More"}
          </Button>
        </div>
      </div>
    </section>
  );
}
