"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy, ClipboardCheck, BarChart3, MessageCircle,
  ArrowRight, Users, Timer, Target,
  ChevronRight, Play, Star, Shield, BookOpen,
  GraduationCap, CheckCircle2, Sparkles, TrendingUp,
  Clock, Brain, Rocket, Heart, Smartphone, Award, Search, Loader2,
} from "lucide-react";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useI18n } from "@/lib/i18n";

/* ───────────── animation helpers ───────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

/* ───────────── counter hook ───────────── */

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || target === 0) return;
    setCount(0);
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(interval); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(interval);
  }, [started, target, duration]);

  return { count, ref };
}

/* ───────────── Stat Card ───────────── */

function StatCard({ target, suffix, label, icon: Icon, color }: {
  target: number; suffix: string; label: string; icon: React.ElementType; color: string;
}) {
  const { count, ref } = useCountUp(target);
  return (
    <motion.div
      variants={fadeUp}
      ref={ref}
      className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 text-center hover:bg-white/[0.07] transition-all"
    >
      <div className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br ${color} mb-4`}>
        <Icon className="h-6 w-6 text-white/80" />
      </div>
      <p className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-gray-400 mt-2 text-sm">{label}</p>
    </motion.div>
  );
}

/* ───────────── Section Component ───────────── */

function SectionHeader({ badge, badgeColor, badgeIcon: BadgeIcon, title, highlight, highlightGradient, subtitle }: {
  badge: string; badgeColor: string; badgeIcon: React.ElementType;
  title: string; highlight: string; highlightGradient: string; subtitle?: string;
}) {
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
      <div className={`inline-flex items-center gap-2 rounded-full ${badgeColor} px-4 py-1.5 text-xs mb-6`}>
        <BadgeIcon className="h-3.5 w-3.5" />
        {badge}
      </div>
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
        {title}{" "}
        <span className={`bg-gradient-to-r ${highlightGradient} bg-clip-text text-transparent`}>
          {highlight}
        </span>
      </h2>
      {subtitle && <p className="text-gray-400 max-w-2xl mx-auto text-lg">{subtitle}</p>}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */

export default function Home() {
  const [stats, setStats] = useState({ total_users: 0, total_olympiads: 0, total_mock_tests: 0 });
  const { t } = useI18n();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`)
      .then(r => r.json())
      .then(data => { if (data?.data) setStats(data.data); })
      .catch(() => {});
  }, []);

  /* ───────────── data arrays using t() ───────────── */

  const features = [
    { icon: ClipboardCheck, title: t("features.mock_tests"), desc: t("features.mock_tests_desc"), color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-400", badge: t("features.most_popular") },
    { icon: Trophy, title: t("features.olympiads"), desc: t("features.olympiads_desc"), color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-400", badge: null },
    { icon: BarChart3, title: t("features.rating"), desc: t("features.rating_desc"), color: "from-green-500/20 to-green-500/5", iconColor: "text-green-400", badge: null },
    { icon: Brain, title: t("features.analysis"), desc: t("features.analysis_desc"), color: "from-purple-500/20 to-purple-500/5", iconColor: "text-purple-400", badge: null },
    { icon: MessageCircle, title: t("features.chat"), desc: t("features.chat_desc"), color: "from-rose-500/20 to-rose-500/5", iconColor: "text-rose-400", badge: null },
    { icon: Shield, title: t("features.anticheat"), desc: t("features.anticheat_desc"), color: "from-cyan-500/20 to-cyan-500/5", iconColor: "text-cyan-400", badge: t("features.reliable") },
  ];

  const steps = [
    { step: 1, title: t("howit.step1"), desc: t("howit.step1_desc"), icon: Users, gradient: "from-blue-500 to-blue-600" },
    { step: 2, title: t("howit.step2"), desc: t("howit.step2_desc"), icon: BookOpen, gradient: "from-indigo-500 to-indigo-600" },
    { step: 3, title: t("howit.step3"), desc: t("howit.step3_desc"), icon: Timer, gradient: "from-purple-500 to-purple-600" },
    { step: 4, title: t("howit.step4"), desc: t("howit.step4_desc"), icon: TrendingUp, gradient: "from-pink-500 to-pink-600" },
  ];

  const testimonials = [
    { name: t("testimonials.t1_name"), role: t("testimonials.t1_role"), text: t("testimonials.t1_text"), avatar: "S", color: "bg-blue-500" },
    { name: t("testimonials.t2_name"), role: t("testimonials.t2_role"), text: t("testimonials.t2_text"), avatar: "M", color: "bg-purple-500" },
    { name: t("testimonials.t3_name"), role: t("testimonials.t3_role"), text: t("testimonials.t3_text"), avatar: "J", color: "bg-green-500" },
    { name: t("testimonials.t4_name"), role: t("testimonials.t4_role"), text: t("testimonials.t4_text"), avatar: "N", color: "bg-amber-500" },
    { name: t("testimonials.t5_name"), role: t("testimonials.t5_role"), text: t("testimonials.t5_text"), avatar: "A", color: "bg-rose-500" },
    { name: t("testimonials.t6_name"), role: t("testimonials.t6_role"), text: t("testimonials.t6_text"), avatar: "D", color: "bg-cyan-500" },
  ];

  const faqs = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
  ];

  const leaderboardData = [
    { rank: 1, name: "Sardor A.", subject: t("subject.math"), score: 98, medal: "bg-amber-400" },
    { rank: 2, name: "Madina K.", subject: t("subject.physics"), score: 95, medal: "bg-gray-300" },
    { rank: 3, name: "Jasur T.", subject: t("subject.math"), score: 93, medal: "bg-amber-600" },
    { rank: 4, name: "Nilufar R.", subject: t("subject.biology"), score: 91, medal: "" },
    { rank: 5, name: "Azizbek M.", subject: t("subject.chemistry"), score: 89, medal: "" },
  ];

  const previewCards = [
    { label: t("preview.tests"), value: "128", icon: ClipboardCheck, color: "text-blue-400" },
    { label: t("preview.correct"), value: "89%", icon: Target, color: "text-green-400" },
    { label: t("preview.rating"), value: "#12", icon: BarChart3, color: "text-purple-400" },
    { label: t("preview.olympiads"), value: "7", icon: Trophy, color: "text-amber-400" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      <Navbar />

      {/* ════════ HERO ════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-24 md:py-32 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 px-5 py-2 text-sm text-blue-300 mb-8">
            <Sparkles className="h-4 w-4" />
            {t("hero.badge")}
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.08] mb-6">
            {t("hero.title1")}{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {t("hero.title2")}
            </span>{" "}
            {t("hero.title3")}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("hero.desc")}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a href="#features">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 text-base font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow cursor-pointer">
                <Rocket className="h-5 w-5" /> {t("hero.cta1")}
              </motion.div>
            </a>
            <Link href="/news">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white px-8 py-4 text-base font-semibold hover:bg-white/10 transition-colors cursor-pointer">
                <Play className="h-5 w-5" /> {t("hero.cta2")}
              </motion.div>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-16">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> {t("hero.badge1")}</span>
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-blue-400" /> {t("hero.badge2")}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-purple-400" /> {t("hero.badge3")}</span>
          </motion.div>

          {/* macOS window preview */}
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.7 }} className="max-w-4xl mx-auto">
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl shadow-black/40">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-3 text-xs text-gray-500">nextolymp.uz/dashboard</span>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {previewCards.map((s, i) => (
                  <div key={i} className="rounded-xl bg-white/5 border border-white/5 p-4 text-left">
                    <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ STATS ════════ */}
      <section className="relative py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.03] to-transparent" />
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="relative z-10 max-w-6xl mx-auto px-4">
          <motion.p variants={fadeUp} className="text-center text-gray-500 text-sm uppercase tracking-widest mb-12">{t("stats.subtitle")}</motion.p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard target={stats.total_users || 0} suffix="+" label={t("stats.users")} icon={Users} color="from-blue-500/20 to-blue-500/5" />
            <StatCard target={stats.total_mock_tests || 0} suffix="+" label={t("stats.tests")} icon={ClipboardCheck} color="from-green-500/20 to-green-500/5" />
            <StatCard target={stats.total_olympiads || 0} suffix="+" label={t("stats.olympiads")} icon={Trophy} color="from-amber-500/20 to-amber-500/5" />
            <StatCard target={98} suffix="%" label={t("stats.feedback")} icon={Heart} color="from-rose-500/20 to-rose-500/5" />
          </div>
        </motion.div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section id="features" className="relative py-24 md:py-32">
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <SectionHeader badge={t("features.badge")} badgeColor="bg-blue-500/10 border border-blue-500/20 text-blue-300" badgeIcon={Sparkles}
            title={t("features.title")} highlight={t("features.highlight")} highlightGradient="from-blue-400 to-indigo-400"
            subtitle={t("features.desc")} />

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeUp} whileHover={{ scale: 1.03, y: -6 }} transition={{ duration: 0.3 }}
                className="group relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 hover:border-white/20 hover:bg-white/[0.07] transition-all cursor-default">
                {f.badge && (
                  <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/20">
                    {f.badge}
                  </span>
                )}
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6`}>
                  <f.icon className={`h-7 w-7 ${f.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════ HOW IT WORKS ════════ */}
      <section id="how-it-works" className="relative py-24 md:py-32">
        <div className="absolute bottom-[10%] left-[-8%] w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <SectionHeader badge={t("howit.badge")} badgeColor="bg-purple-500/10 border border-purple-500/20 text-purple-300" badgeIcon={Rocket}
            title={t("howit.title")} highlight={t("howit.highlight")} highlightGradient="from-blue-400 to-purple-400"
            subtitle={t("howit.desc")} />

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((s, i) => (
              <motion.div key={i} variants={fadeUp} whileHover={{ y: -4 }}
                className="relative flex items-start gap-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:bg-white/[0.07] transition-all group">
                <div className={`flex-shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <s.icon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">{s.step}-{t("howit.step")}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════ LEADERBOARD PREVIEW ════════ */}
      <section className="relative py-24 md:py-32">
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[700px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={slideInLeft}>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/20 px-4 py-1.5 text-xs text-green-300 mb-6">
                <BarChart3 className="h-3.5 w-3.5" /> {t("leaderboard.badge")}
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6">
                {t("leaderboard.title")}{" "}
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{t("leaderboard.highlight")}</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                {t("leaderboard.desc")}
              </p>
              <ul className="space-y-4">
                {[t("leaderboard.feature1"), t("leaderboard.feature2"), t("leaderboard.feature3"), t("leaderboard.feature4")].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" /> <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={slideInRight}>
              <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl shadow-black/40">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <div className="w-3 h-3 rounded-full bg-red-500" /><div className="w-3 h-3 rounded-full bg-yellow-500" /><div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-3 text-xs text-gray-500">nextolymp.uz/leaderboard</span>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-12 gap-3 text-xs uppercase tracking-wider text-gray-500 mb-3 px-3">
                    <div className="col-span-1">{t("leaderboard.rank")}</div><div className="col-span-5">{t("leaderboard.name")}</div><div className="col-span-3">{t("leaderboard.subject")}</div><div className="col-span-3 text-right">{t("leaderboard.score")}</div>
                  </div>
                  {leaderboardData.map((r, i) => (
                    <div key={i} className={`grid grid-cols-12 gap-3 items-center px-3 py-2.5 rounded-xl mb-1.5 ${i === 0 ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/[0.02]"}`}>
                      <div className="col-span-1 font-bold text-gray-300">
                        {r.medal ? <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${r.medal} text-gray-900 text-xs font-bold`}>{r.rank}</span> : r.rank}
                      </div>
                      <div className="col-span-5 font-medium text-sm">{r.name}</div>
                      <div className="col-span-3 text-gray-400 text-sm">{r.subject}</div>
                      <div className="col-span-3 text-right">
                        <span className="inline-flex items-center rounded-full bg-blue-500/10 text-blue-400 px-2.5 py-0.5 text-sm font-semibold">{r.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-12 bg-gradient-to-t from-gray-950/90 to-transparent -mt-12 relative z-10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════ SERTIFIKAT TEKSHIRISH ════════ */}
      <section id="certificate" className="relative py-24 md:py-32">
        <div className="absolute top-[30%] right-[-5%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <SectionHeader badge={t("certificate.badge")} badgeColor="bg-amber-500/10 border border-amber-500/20 text-amber-300" badgeIcon={Award}
            title={t("certificate.title")} highlight={t("certificate.highlight")} highlightGradient="from-amber-400 to-orange-400"
            subtitle={t("certificate.desc")} />

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="max-w-2xl mx-auto">
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 mb-6">
                <Loader2 className="h-10 w-10 text-amber-400 animate-spin" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{t("certificate.in_progress")}</h3>
              <p className="text-gray-400 mb-8 leading-relaxed">
                {t("certificate.in_progress_desc")}
              </p>
              <div className="flex items-center justify-center gap-3 rounded-xl bg-white/5 border border-white/10 p-4">
                <Search className="h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder={t("certificate.placeholder")}
                  disabled
                  className="flex-1 bg-transparent text-gray-500 placeholder-gray-600 outline-none cursor-not-allowed"
                />
                <button disabled className="px-5 py-2 rounded-lg bg-amber-500/20 text-amber-400/50 font-semibold text-sm cursor-not-allowed">
                  {t("certificate.check")}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-4">{t("certificate.coming_soon")}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ TESTIMONIALS ════════ */}
      <section id="testimonials" className="relative py-24 md:py-32">
        <div className="absolute top-[20%] left-[-5%] w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <SectionHeader badge={t("testimonials.badge")} badgeColor="bg-rose-500/10 border border-rose-500/20 text-rose-300" badgeIcon={Heart}
            title={t("testimonials.title")} highlight={t("testimonials.highlight")} highlightGradient="from-rose-400 to-pink-400" />

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((tItem, i) => (
              <motion.div key={i} variants={fadeUp} whileHover={{ y: -4 }}
                className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:bg-white/[0.07] transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">&quot;{tItem.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${tItem.color} flex items-center justify-center text-white font-bold text-sm`}>{tItem.avatar}</div>
                  <div><p className="font-semibold text-sm">{tItem.name}</p><p className="text-gray-500 text-xs">{tItem.role}</p></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════ FAQ ════════ */}
      <section id="faq" className="relative py-24 md:py-32">
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <SectionHeader badge={t("faq.badge")} badgeColor="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300" badgeIcon={MessageCircle}
            title={t("faq.title")} highlight={t("faq.highlight")} highlightGradient="from-indigo-400 to-blue-400" />

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-4">
            {faqs.map((item, i) => (
              <motion.details key={i} variants={fadeUp}
                className="group rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden hover:bg-white/[0.07] transition-all">
                <summary className="flex items-center justify-between cursor-pointer p-6 text-white font-semibold list-none">
                  <span>{item.q}</span>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0 ml-4" />
                </summary>
                <div className="px-6 pb-6 -mt-2"><p className="text-gray-400 text-sm leading-relaxed">{item.a}</p></div>
              </motion.details>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════ FINAL CTA ════════ */}
      <section className="relative py-24 md:py-32">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative max-w-4xl mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-purple-600/30" />
            <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="relative z-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-16 md:px-16 md:py-20 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 shadow-lg shadow-blue-500/30">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4">{t("cta.title")}</h2>
              <p className="text-gray-400 max-w-md mx-auto mb-10 text-lg">
                {t("cta.desc")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="https://play.google.com/store/apps/details?id=com.nextolymp" target="_blank" rel="noreferrer">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-10 py-4 text-lg font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow cursor-pointer">
                    <Smartphone className="h-5 w-5" /> {t("cta.android")}
                  </motion.div>
                </a>
                <a href="https://nextolymp.uz/download/windows" target="_blank" rel="noreferrer">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/10 text-white px-10 py-4 text-lg font-semibold hover:bg-white/15 transition-all cursor-pointer">
                    {t("cta.windows")} <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ───────── Ilovalarni yuklab olish ───────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent" />
        <motion.div className="max-w-4xl mx-auto px-4 text-center relative z-10"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 px-4 py-1.5 text-xs mb-6">
              <Smartphone className="h-3.5 w-3.5" />
              {t("apps.badge")}
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
              {t("apps.title")}{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{t("apps.highlight")}</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">{t("apps.desc")}</p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
            <a href="https://play.google.com/store/apps/details?id=com.nextolymp" target="_blank" rel="noreferrer"
              className="group flex items-center gap-4 rounded-2xl bg-white/5 border border-white/10 px-8 py-5 hover:bg-white/10 hover:border-white/20 transition-all w-full sm:w-auto">
              <svg className="h-10 w-10 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 0 1 0 1.38l-2.302 2.302L15.396 12l2.302-2.492zM5.864 2.658L16.8 9.49l-2.302 2.302L5.864 2.658z"/></svg>
              <div className="text-left">
                <p className="text-xs text-gray-400">{t("apps.download")}</p>
                <p className="text-lg font-bold text-white">{t("apps.android")}</p>
              </div>
            </a>
            <a href="https://nextolymp.uz/download/windows" target="_blank" rel="noreferrer"
              className="group flex items-center gap-4 rounded-2xl bg-white/5 border border-white/10 px-8 py-5 hover:bg-white/10 hover:border-white/20 transition-all w-full sm:w-auto">
              <svg className="h-10 w-10 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
              <div className="text-left">
                <p className="text-xs text-gray-400">{t("apps.download")}</p>
                <p className="text-lg font-bold text-white">{t("apps.windows")}</p>
              </div>
            </a>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
