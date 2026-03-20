"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  ClipboardCheck,
  BarChart3,
  MessageCircle,
  ArrowRight,
  Zap,
  Users,
  Timer,
  Target,
  Award,
  ChevronRight,
  Play,
  Menu,
  X,
  Star,
  Shield,
  BookOpen,
  GraduationCap,
  Globe,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Clock,
  Brain,
  Rocket,
  Heart,
  Mail,
  Phone,
  MapPin,
  Send,
  Instagram,
  Github,
} from "lucide-react";

/* ───────────── animation helpers ───────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
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
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
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
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [started, target, duration]);

  return { count, ref };
}

/* ───────────── Navbar ───────────── */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Imkoniyatlar", href: "#features" },
    { label: "Qanday ishlaydi", href: "#how-it-works" },
    { label: "Narxlar", href: "#pricing" },
    { label: "Fikrlar", href: "#testimonials" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" as const }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-gray-950/80 backdrop-blur-2xl border-b border-white/5 shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-extrabold text-white">
                Next<span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Olymp</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-all"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-all"
              >
                Kirish
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105 active:scale-95"
              >
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-40 pt-16 bg-gray-950/95 backdrop-blur-2xl md:hidden"
          >
            <div className="px-4 py-6 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-lg text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-all"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <Link
                  href="/login"
                  className="block w-full text-center px-5 py-3 text-base font-medium text-gray-300 rounded-xl border border-white/10 hover:bg-white/5 transition-all"
                >
                  Kirish
                </Link>
                <Link
                  href="/register"
                  className="block w-full text-center px-5 py-3 text-base font-semibold text-white rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25"
                >
                  Ro&apos;yxatdan o&apos;tish
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
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
        {count.toLocaleString()}
        {suffix}
      </p>
      <p className="text-gray-400 mt-2 text-sm">{label}</p>
    </motion.div>
  );
}

/* ───────────── page ───────────── */

export default function Home() {
  const [stats, setStats] = useState({ total_users: 0, total_olympiads: 0, total_mock_tests: 0 });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`)
      .then(r => r.json())
      .then(data => {
        if (data?.data) setStats(data.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      <Navbar />

      {/* ════════ HERO ════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* animated gradient orbs */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        {/* grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-24 md:py-32 text-center">
          {/* badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 px-5 py-2 text-sm text-blue-300 mb-8"
          >
            <Sparkles className="h-4 w-4" />
            O&apos;zbekistonning #1 onlayn olimpiada platformasi
          </motion.div>

          {/* headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.08] mb-6"
          >
            Bilimingizni sinang.{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Raqobatda g&apos;olib
            </span>{" "}
            bo&apos;ling.
          </motion.h1>

          {/* sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Olimpiadalarga tayyorlaning, mock testlar yeching, real vaqtda reytingda raqobatlashing.
            Minglab o&apos;quvchilar allaqachon bizni tanlamoqda.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <Link href="/register">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 text-base font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow cursor-pointer"
              >
                <Rocket className="h-5 w-5" />
                Bepul boshlash
              </motion.div>
            </Link>
            <Link href="/login">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white px-8 py-4 text-base font-semibold hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Play className="h-5 w-5" />
                Hisobga kirish
              </motion.div>
            </Link>
          </motion.div>

          {/* trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-16"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Bepul ro&apos;yxatdan o&apos;tish
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-blue-400" />
              Xavfsiz platforma
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-purple-400" />
              24/7 ishlaydi
            </span>
          </motion.div>

          {/* macOS window preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.7 }}
            className="max-w-4xl mx-auto"
          >
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl shadow-black/40">
              {/* title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-3 text-xs text-gray-500">nextolymp.uz/dashboard</span>
              </div>
              {/* fake dashboard */}
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Jami testlar", value: "128", icon: ClipboardCheck, color: "text-blue-400" },
                  { label: "To'g'ri javoblar", value: "89%", icon: Target, color: "text-green-400" },
                  { label: "Reyting", value: "#12", icon: BarChart3, color: "text-purple-400" },
                  { label: "Olimpiadalar", value: "7", icon: Trophy, color: "text-amber-400" },
                ].map((s, i) => (
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

      {/* ════════ SOCIAL PROOF / STATS ════════ */}
      <section className="relative py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.03] to-transparent" />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="relative z-10 max-w-6xl mx-auto px-4"
        >
          <motion.p variants={fadeUp} className="text-center text-gray-500 text-sm uppercase tracking-widest mb-12">
            Raqamlarda biz
          </motion.p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard target={stats.total_users || 0} suffix="+" label="Faol o'quvchilar" icon={Users} color="from-blue-500/20 to-blue-500/5" />
            <StatCard target={stats.total_mock_tests || 0} suffix="+" label="Yechilgan testlar" icon={ClipboardCheck} color="from-green-500/20 to-green-500/5" />
            <StatCard target={stats.total_olympiads || 0} suffix="+" label="Olimpiadalar" icon={Trophy} color="from-amber-500/20 to-amber-500/5" />
            <StatCard target={98} suffix="%" label="Ijobiy fikrlar" icon={Heart} color="from-rose-500/20 to-rose-500/5" />
          </div>
        </motion.div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section id="features" className="relative py-24 md:py-32">
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-xs text-blue-300 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              IMKONIYATLAR
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
              Muvaffaqiyat uchun{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                hamma narsa
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Olimpiada va imtihonlarga tayyorlanish uchun kerakli barcha vositalar bir joyda
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                icon: ClipboardCheck,
                title: "Mock Testlar",
                desc: "Istalgan vaqtda mashq qiling. Real imtihon formatida, timer bilan, natijangizni tahlil qiling.",
                color: "from-blue-500/20 to-blue-500/5",
                iconColor: "text-blue-400",
                badge: "Eng mashhur",
              },
              {
                icon: Trophy,
                title: "Online Olimpiadalar",
                desc: "Haqiqiy raqobat muhitida bilimingizni sinang. Real vaqtda natijalar va reyting.",
                color: "from-amber-500/20 to-amber-500/5",
                iconColor: "text-amber-400",
                badge: null,
              },
              {
                icon: BarChart3,
                title: "Live Reyting",
                desc: "Haftalik va umumiy reyting. O'z o'rningizni bilish va boshqalar bilan taqqoslash.",
                color: "from-green-500/20 to-green-500/5",
                iconColor: "text-green-400",
                badge: null,
              },
              {
                icon: Brain,
                title: "Batafsil Tahlil",
                desc: "Har bir test natijasi bo'yicha xatolaringizni ko'ring va kuchli-zaif tomonlaringizni bilib oling.",
                color: "from-purple-500/20 to-purple-500/5",
                iconColor: "text-purple-400",
                badge: null,
              },
              {
                icon: MessageCircle,
                title: "Onlayn Chat",
                desc: "Boshqa o'quvchilar bilan muloqot qiling, savollar bering, tajriba almashing.",
                color: "from-rose-500/20 to-rose-500/5",
                iconColor: "text-rose-400",
                badge: null,
              },
              {
                icon: Shield,
                title: "Anti-Cheat Tizim",
                desc: "Test paytida adolatli muhit. Tab almashish va nusxa ko'chirish nazorat ostida.",
                color: "from-cyan-500/20 to-cyan-500/5",
                iconColor: "text-cyan-400",
                badge: "Ishonchli",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ scale: 1.03, y: -6 }}
                transition={{ duration: 0.3 }}
                className="group relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 hover:border-white/20 hover:bg-white/[0.07] transition-all cursor-default"
              >
                {f.badge && (
                  <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/20">
                    {f.badge}
                  </span>
                )}
                <div
                  className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6`}
                >
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
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 text-xs text-purple-300 mb-6">
              <Rocket className="h-3.5 w-3.5" />
              QANDAY ISHLAYDI
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
              Boshlash juda{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                oson
              </span>
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto text-lg">
              Atigi 4 qadamda olimpiadalarga tayyorlanishni boshlang
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {[
              {
                step: 1,
                title: "Ro'yxatdan o'ting",
                desc: "Email va parol bilan tezkor ro'yxatdan o'tish. 1 daqiqadan kam vaqt oladi.",
                icon: Users,
                gradient: "from-blue-500 to-blue-600",
              },
              {
                step: 2,
                title: "Fan va testni tanlang",
                desc: "Matematika, Fizika, Kimyo, Biologiya va boshqa fanlar bo'yicha testlar mavjud.",
                icon: BookOpen,
                gradient: "from-indigo-500 to-indigo-600",
              },
              {
                step: 3,
                title: "Testni ishlang",
                desc: "Timer ostida savollarni yeching. Anti-cheat tizim adolatli natijalarni kafolatlaydi.",
                icon: Timer,
                gradient: "from-purple-500 to-purple-600",
              },
              {
                step: 4,
                title: "Natijangizni ko'ring",
                desc: "Ball, reyting, xatolar tahlili — hammasini ko'ring va o'zingizni rivojlantiring.",
                icon: TrendingUp,
                gradient: "from-pink-500 to-pink-600",
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="relative flex items-start gap-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:bg-white/[0.07] transition-all group"
              >
                <div className={`flex-shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <s.icon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                      {s.step}-qadam
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════ DASHBOARD PREVIEW ════════ */}
      <section className="relative py-24 md:py-32">
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[700px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* text side */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={slideInLeft}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/20 px-4 py-1.5 text-xs text-green-300 mb-6">
                <BarChart3 className="h-3.5 w-3.5" />
                LIVE REYTING
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6">
                Real vaqtda{" "}
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  raqobatlashing
                </span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Har bir test va olimpiada uchun jonli reyting. Natijangiz bilan boshqalar orasida o&apos;z o&apos;rningizni darhol ko&apos;ring.
              </p>
              <ul className="space-y-4">
                {[
                  "Real vaqtda yangilanuvchi reyting jadvali",
                  "Haftalik va oylik statistika",
                  "Fan bo'yicha alohida reytinglar",
                  "Top o'quvchilar uchun maxsus mukofotlar",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* leaderboard preview */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={slideInRight}
            >
              <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl shadow-black/40">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-3 text-xs text-gray-500">nextolymp.uz/leaderboard</span>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-12 gap-3 text-xs uppercase tracking-wider text-gray-500 mb-3 px-3">
                    <div className="col-span-1">#</div>
                    <div className="col-span-5">Ism</div>
                    <div className="col-span-3">Fan</div>
                    <div className="col-span-3 text-right">Ball</div>
                  </div>
                  {[
                    { rank: 1, name: "Sardor A.", subject: "Matematika", score: 98, medal: "bg-amber-400" },
                    { rank: 2, name: "Madina K.", subject: "Fizika", score: 95, medal: "bg-gray-300" },
                    { rank: 3, name: "Jasur T.", subject: "Matematika", score: 93, medal: "bg-amber-600" },
                    { rank: 4, name: "Nilufar R.", subject: "Biologiya", score: 91, medal: "" },
                    { rank: 5, name: "Azizbek M.", subject: "Kimyo", score: 89, medal: "" },
                  ].map((r, i) => (
                    <div
                      key={i}
                      className={`grid grid-cols-12 gap-3 items-center px-3 py-2.5 rounded-xl mb-1.5 ${
                        i === 0 ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/[0.02]"
                      }`}
                    >
                      <div className="col-span-1 font-bold text-gray-300">
                        {r.medal ? (
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${r.medal} text-gray-900 text-xs font-bold`}>
                            {r.rank}
                          </span>
                        ) : (
                          r.rank
                        )}
                      </div>
                      <div className="col-span-5 font-medium text-sm">{r.name}</div>
                      <div className="col-span-3 text-gray-400 text-sm">{r.subject}</div>
                      <div className="col-span-3 text-right">
                        <span className="inline-flex items-center rounded-full bg-blue-500/10 text-blue-400 px-2.5 py-0.5 text-sm font-semibold">
                          {r.score}
                        </span>
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

      {/* ════════ PRICING ════════ */}
      <section id="pricing" className="relative py-24 md:py-32">
        <div className="absolute top-[30%] right-[-5%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-xs text-amber-300 mb-6">
              <Star className="h-3.5 w-3.5" />
              NARXLAR
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
              Hamyonbop{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                narxlar
              </span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-lg">
              O&apos;zingizga qulay tarifni tanlang. Promo kod bilan qo&apos;shimcha imtiyozlar oling.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {[
              {
                name: "Bepul",
                price: "0",
                period: "so'm",
                desc: "Platformani sinab ko'rish uchun",
                features: [
                  "Cheklangan mock testlar",
                  "Umumiy reyting",
                  "Onlayn chat",
                  "Profil sahifasi",
                ],
                cta: "Boshlash",
                popular: false,
                gradient: "from-gray-600 to-gray-700",
              },
              {
                name: "Standart",
                price: "15,000",
                period: "so'm / oy",
                desc: "Faol o'quvchilar uchun",
                features: [
                  "Barcha mock testlar",
                  "Olimpiadalarga qatnashish",
                  "Batafsil tahlil",
                  "Reyting tizimi",
                  "Promo kodlar",
                  "Ustuvor qo'llab-quvvatlash",
                ],
                cta: "Tanlash",
                popular: true,
                gradient: "from-blue-500 to-indigo-600",
              },
              {
                name: "Premium",
                price: "25,000",
                period: "so'm / oy",
                desc: "Maksimal imkoniyatlar",
                features: [
                  "Standart tarifdagi hamma narsa",
                  "Cheksiz test imkoniyati",
                  "VIP olimpiadalar",
                  "Shaxsiy statistika",
                  "Maxsus mukofotlar",
                  "1-darajali qo'llab-quvvatlash",
                ],
                cta: "Tanlash",
                popular: false,
                gradient: "from-purple-500 to-pink-600",
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -8 }}
                className={`relative rounded-2xl border p-8 transition-all ${
                  plan.popular
                    ? "bg-gradient-to-b from-blue-500/10 to-indigo-500/5 border-blue-500/30 shadow-xl shadow-blue-500/10"
                    : "bg-white/5 border-white/10 hover:bg-white/[0.07]"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1 rounded-full shadow-lg shadow-blue-500/30">
                    Mashhur
                  </span>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-6">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-gray-400 text-sm ml-2">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════ TESTIMONIALS ════════ */}
      <section id="testimonials" className="relative py-24 md:py-32">
        <div className="absolute top-[20%] left-[-5%] w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 text-xs text-rose-300 mb-6">
              <Heart className="h-3.5 w-3.5" />
              FIKRLAR
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
              O&apos;quvchilar{" "}
              <span className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                nima deydi
              </span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                name: "Sardor Alimov",
                role: "11-sinf, Toshkent",
                text: "NextOlymp orqali olimpiadaga tayyorlandim va viloyat bosqichidan o'tdim. Mock testlar juda foydali bo'ldi!",
                avatar: "S",
                color: "bg-blue-500",
                stars: 5,
              },
              {
                name: "Madina Karimova",
                role: "10-sinf, Samarqand",
                text: "Real vaqtda reyting ko'rish juda qiziqarli. Har kuni testlar yechib, o'zimni rivojlantiryapman.",
                avatar: "M",
                color: "bg-purple-500",
                stars: 5,
              },
              {
                name: "Jasur Toshmatov",
                role: "9-sinf, Buxoro",
                text: "Anti-cheat tizim bor, shuning uchun natijalar adolatli. Chat orqali boshqa o'quvchilardan yordam olaman.",
                avatar: "J",
                color: "bg-green-500",
                stars: 5,
              },
              {
                name: "Nilufar Rahimova",
                role: "11-sinf, Andijon",
                text: "Platformadagi tahlil funksiyasi juda ajoyib. Xatolarimni ko'rib, keyingi safar tuzataman.",
                avatar: "N",
                color: "bg-amber-500",
                stars: 5,
              },
              {
                name: "Azizbek Mo'minov",
                role: "10-sinf, Farg'ona",
                text: "Narxlari hamyonbop, sifati esa yuqori. Do'stlarimga ham tavsiya qildim!",
                avatar: "A",
                color: "bg-rose-500",
                stars: 5,
              },
              {
                name: "Dildora Yusupova",
                role: "9-sinf, Namangan",
                text: "Olimpiada testlarini ishlash juda qiziq. O'zimni haqiqiy musobaqada his qilaman!",
                avatar: "D",
                color: "bg-cyan-500",
                stars: 5,
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:bg-white/[0.07] transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">&quot;{t.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════ FAQ ════════ */}
      <section id="faq" className="relative py-24 md:py-32">
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 text-xs text-indigo-300 mb-6">
              <MessageCircle className="h-3.5 w-3.5" />
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
              Ko&apos;p beriladigan{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                savollar
              </span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {[
              {
                q: "NextOlymp bepulmi?",
                a: "Ha, ro'yxatdan o'tish bepul. Asosiy funksiyalardan foydalanish uchun bepul tarif mavjud. Qo'shimcha imkoniyatlar uchun pullik tariflar ham bor.",
              },
              {
                q: "Qaysi fanlar bo'yicha testlar bor?",
                a: "Matematika, Fizika, Kimyo, Biologiya, Ingliz tili va boshqa fanlar bo'yicha testlar mavjud. Yangi fanlar muntazam qo'shib boriladi.",
              },
              {
                q: "Olimpiadalarga qanday qatnashaman?",
                a: "Ro'yxatdan o'tganingizdan so'ng, 'Olimpiadalar' bo'limiga o'ting. Faol olimpiadalarni ko'rasiz va bir tugma bilan qatnashishingiz mumkin.",
              },
              {
                q: "Test paytida internet uzilib qolsa nima bo'ladi?",
                a: "Tizim javoblaringizni avtomatik saqlaydi. Internet qayta ulanganda testni davom ettirishingiz mumkin.",
              },
              {
                q: "Promo kod nima?",
                a: "Promo kodlar orqali balans to'ldirishingiz yoki chegirma olishingiz mumkin. Promo kodlarni profil sahifangizdagi 'Balans' bo'limida kiritishingiz mumkin.",
              },
              {
                q: "Mobil qurilmada ishlaydi mi?",
                a: "Ha, platforma barcha qurilmalarda (telefon, planshet, kompyuter) mukammal ishlaydi. Maxsus dastur yuklab olish shart emas.",
              },
            ].map((item, i) => (
              <motion.details
                key={i}
                variants={fadeUp}
                className="group rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden hover:bg-white/[0.07] transition-all"
              >
                <summary className="flex items-center justify-between cursor-pointer p-6 text-white font-semibold list-none">
                  <span>{item.q}</span>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0 ml-4" />
                </summary>
                <div className="px-6 pb-6 -mt-2">
                  <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              </motion.details>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════ FINAL CTA ════════ */}
      <section className="relative py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-4xl mx-auto px-4"
        >
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-purple-600/30" />
            <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="relative z-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-16 md:px-16 md:py-20 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 shadow-lg shadow-blue-500/30">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
                Bilimingizni sinashga tayyormisiz?
              </h2>
              <p className="text-gray-400 max-w-md mx-auto mb-10 text-lg">
                Hoziroq ro&apos;yxatdan o&apos;ting va minglab o&apos;quvchilar bilan birga bilimingizni sinab ko&apos;ring.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-10 py-4 text-lg font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow cursor-pointer"
                  >
                    Bepul boshlash
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </Link>
                <Link href="/login">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/10 text-white px-10 py-4 text-lg font-semibold hover:bg-white/15 transition-all cursor-pointer"
                  >
                    Hisobga kirish
                  </motion.div>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="relative border-t border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-2xl font-extrabold">
                  Next<span className="text-blue-400">Olymp</span>
                </h3>
              </div>
              <p className="text-gray-500 max-w-sm leading-relaxed mb-6">
                O&apos;zbekiston bo&apos;ylab o&apos;quvchilarni olimpiada va imtihonlarga tayyorlash uchun yaratilgan zamonaviy onlayn test platformasi.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://t.me/nextolymp" target="_blank" rel="noreferrer" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                  <Send className="h-4 w-4" />
                </a>
                <a href="https://instagram.com/nextolymp" target="_blank" rel="noreferrer" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* links */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Platforma</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Mock testlar", href: "/dashboard/mock-tests" },
                  { label: "Olimpiadalar", href: "/dashboard/olympiads" },
                  { label: "Reyting", href: "/dashboard/leaderboard" },
                  { label: "Yangiliklar", href: "/dashboard/news" },
                ].map((l, i) => (
                  <li key={i}>
                    <Link href={l.href} className="text-gray-500 hover:text-white transition-colors text-sm flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Hisob</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Kirish", href: "/login" },
                  { label: "Ro\u2018yxatdan o\u2018tish", href: "/register" },
                  { label: "Profil", href: "/dashboard/profile" },
                  { label: "Balans", href: "/dashboard/profile" },
                ].map((l, i) => (
                  <li key={i}>
                    <Link href={l.href} className="text-gray-500 hover:text-white transition-colors text-sm flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">
              &copy; {new Date().getFullYear()} NextOlymp. Barcha huquqlar himoyalangan.
            </p>
            <div className="flex items-center gap-4 text-gray-600 text-sm">
              <a href="#" className="hover:text-gray-400 transition-colors">Maxfiylik siyosati</a>
              <span className="text-gray-800">|</span>
              <a href="#" className="hover:text-gray-400 transition-colors">Foydalanish shartlari</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
