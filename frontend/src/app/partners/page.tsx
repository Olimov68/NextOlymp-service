"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { useSettings } from "@/lib/settings-context";
import {
  Handshake, CheckCircle2, Mail, ArrowRight,
  GraduationCap, Trophy, Users, Globe, Megaphone, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: Users,
    title: "Keng auditoriya",
    desc: "Minglab o'quvchilar va ota-onalarga brendingizni tanishtiring. Platformamiz butun O'zbekiston bo'ylab faol foydalaniladi.",
  },
  {
    icon: Trophy,
    title: "Olimpiadalarda brend ko'rinishi",
    desc: "Hamkor sifatida olimpiada sahifalarida, sertifikatlarda va natijalar ro'yxatida logotipingiz ko'rsatiladi.",
  },
  {
    icon: Megaphone,
    title: "Marketing va reklama",
    desc: "Ijtimoiy tarmoqlar, yangiliklar va e'lonlar orqali hamkorligingiz keng auditoriyaga yetkaziladi.",
  },
  {
    icon: GraduationCap,
    title: "Ta'lim missiyasi",
    desc: "O'zbekistonda ta'lim sifatini oshirish missiyasiga hissa qo'shing va ijtimoiy mas'uliyatingizni namoyish eting.",
  },
  {
    icon: BarChart3,
    title: "Statistika va hisobotlar",
    desc: "Hamkorlik natijalari bo'yicha to'liq statistika va hisobotlar taqdim etiladi.",
  },
  {
    icon: Globe,
    title: "Xalqaro tajriba",
    desc: "Xalqaro olimpiada standartlari asosida ishlash va global ta'lim hamjamiyatiga qo'shilish imkoniyati.",
  },
];

const requirements = [
  "Ta'lim yoki texnologiya sohasida faoliyat yuritish",
  "O'zbekistondagi o'quvchilarni qo'llab-quvvatlash istagi",
  "Kamida 6 oylik hamkorlik muddatiga tayyor bo'lish",
  "Logotip va brend materiallari taqdim eta olish",
  "Hamkorlik shartnomasini imzolash",
];

const partnershipTypes = [
  {
    title: "Asosiy hamkor",
    desc: "Platformaning asosiy sahifasida, barcha olimpiadalarda va sertifikatlarda logotip. Maxsus marketing kampaniyalari.",
    color: "from-amber-500/10 to-orange-500/10 border-amber-500/30",
  },
  {
    title: "Olimpiada homiysi",
    desc: "Muayyan olimpiada yoki fan yo'nalishi bo'yicha homiylik. Shu olimpiada sahifalarida brend ko'rinishi.",
    color: "from-blue-500/10 to-indigo-500/10 border-blue-500/30",
  },
  {
    title: "Texnologik hamkor",
    desc: "Platforma rivojlanishiga texnologik hissa. Server, infratuzilma yoki dasturiy ta'minot ko'rinishida.",
    color: "from-emerald-500/10 to-green-500/10 border-emerald-500/30",
  },
];

export default function PartnersPage() {
  const settings = useSettings();
  const supportEmail = settings.support_email || "info@nextolymp.uz";

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50">
        <AnnouncementBar />
        <Header />
      </div>

      <main>
        {/* Hero */}
        <section className="py-20 border-b border-border bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6">
              <Handshake className="h-4 w-4" />
              Hamkorlik
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-5">
              NextOlymp bilan hamkor bo&apos;ling
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed mb-8">
              O&apos;zbekistondagi eng yirik ta&apos;lim olimpiada platformasi bilan hamkorlik qiling.
              Birgalikda ta&apos;lim sifatini oshiramiz va minglab o&apos;quvchilarga yangi imkoniyatlar yaratamiz.
            </p>
            <a href={`mailto:${supportEmail}`}>
              <Button size="lg" className="btn-gradient gap-2 text-base px-8">
                <Mail className="h-5 w-5" />
                Bog&apos;lanish
              </Button>
            </a>
          </div>
        </section>

        {/* Imkoniyatlar */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Hamkorlik imkoniyatlari
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Hamkor sifatida quyidagi afzalliklarga ega bo&apos;lasiz
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className="group rounded-2xl border border-border bg-card p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                    <b.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hamkorlik turlari */}
        <section className="py-20 border-t border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Hamkorlik turlari
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Sizning ehtiyojlaringizga mos hamkorlik shaklini tanlang
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {partnershipTypes.map((pt) => (
                <div
                  key={pt.title}
                  className={`rounded-2xl border bg-gradient-to-br ${pt.color} p-7 text-center`}
                >
                  <h3 className="font-bold text-foreground text-lg mb-3">{pt.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Talablar */}
        <section className="py-20 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Hamkorlik talablari
                </h2>
                <p className="text-muted-foreground">
                  Hamkor bo&apos;lish uchun quyidagi shartlarga javob berishingiz kerak
                </p>
              </div>

              <div className="space-y-4">
                {requirements.map((req, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-foreground">{req}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto rounded-3xl border border-primary/20 bg-primary/5 p-10 md:p-14 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
                <Handshake className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Hamkor bo&apos;lishga tayyormisiz?
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed max-w-lg mx-auto">
                Bizga yozing — hamkorlik shartlari va imkoniyatlar haqida batafsil ma&apos;lumot beramiz.
                Har bir taklif e&apos;tiborga olinadi.
              </p>
              <a href={`mailto:${supportEmail}`}>
                <Button size="lg" className="btn-gradient gap-2 text-base px-8">
                  <Mail className="h-5 w-5" />
                  {supportEmail}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
