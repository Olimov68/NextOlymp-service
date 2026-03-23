"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
} from "lucide-react";

/* ───────────── animation helpers ───────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const scaleHover = {
  whileHover: { scale: 1.04, transition: { duration: 0.25 } },
  whileTap: { scale: 0.98 },
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
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
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

/* ───────────── page ───────────── */

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      {/* ════════ HERO ════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* floating blur circles */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-24 md:py-32 text-center">
          {/* badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-2 text-sm text-blue-300 mb-8"
          >
            <Zap className="h-4 w-4" />
            NextOlymp — Onlayn test platformasi
          </motion.div>

          {/* headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.08] mb-6"
          >
            Online testing.{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Real competition.
            </span>
            <br />
            Real results.
          </motion.h1>

          {/* sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10"
          >
            Olimpiada va imtihonlarga tayyorlanish uchun zamonaviy platforma.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link href="/dashboard/mock-tests">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-4 text-base font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow cursor-pointer"
              >
                <Play className="h-5 w-5" />
                Testni boshlash
              </motion.div>
            </Link>
            <Link href="/dashboard">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white px-8 py-4 text-base font-semibold hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Trophy className="h-5 w-5" />
                Olimpiadalarni ko&apos;rish
              </motion.div>
            </Link>
          </motion.div>

          {/* macOS window preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6 }}
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
                  { label: "To&apos;g&apos;ri javoblar", value: "89%", icon: Target, color: "text-green-400" },
                  { label: "Reyting", value: "#12", icon: BarChart3, color: "text-purple-400" },
                  { label: "Olimpiadalar", value: "7", icon: Trophy, color: "text-amber-400" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-white/5 border border-white/5 p-4 text-left"
                  >
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

      {/* ════════ SOCIAL PROOF ════════ */}
      <section className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.03] to-transparent" />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="relative z-10 max-w-5xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-10 text-center"
        >
          {[
            { target: 1000, suffix: "+", label: "O\u2018quvchilar", icon: Users },
            { target: 5000, suffix: "+", label: "Testlar", icon: ClipboardCheck },
            { target: 50, suffix: "+", label: "Olimpiadalar", icon: Trophy },
          ].map((item, i) => {
            const { count, ref } = useCountUp(item.target);
            return (
              <motion.div key={i} variants={fadeUp} ref={ref}>
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 mb-4">
                  <item.icon className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  {count.toLocaleString()}
                  {item.suffix}
                </p>
                <p className="text-gray-400 mt-2 text-lg">{item.label}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section className="relative py-24 md:py-32">
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-sm uppercase tracking-widest text-blue-400 mb-3">Imkoniyatlar</p>
            <h2 className="text-4xl md:text-5xl font-extrabold">
              Hamma narsa{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                bir joyda
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
                icon: ClipboardCheck,
                title: "Mock Testlar",
                desc: "Istalgan vaqtda mashq qiling. Timer, progress, natija analytics — barchasi real vaqtda.",
                color: "from-blue-500/20 to-blue-500/5",
                iconColor: "text-blue-400",
              },
              {
                icon: Trophy,
                title: "Olimpiadalar",
                desc: "Real time competition. Live ranking. Limited time access. Haqiqiy raqobat muhiti.",
                color: "from-amber-500/20 to-amber-500/5",
                iconColor: "text-amber-400",
              },
              {
                icon: BarChart3,
                title: "Reyting",
                desc: "Eng kuchli o\u2018quvchilar. Weekly leaderboard. O\u2018z o\u2018rningizni bilib oling.",
                color: "from-green-500/20 to-green-500/5",
                iconColor: "text-green-400",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ scale: 1.04, y: -8 }}
                transition={{ duration: 0.3 }}
                className="group rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 hover:border-white/20 hover:bg-white/[0.07] transition-all cursor-default"
              >
                <div
                  className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6`}
                >
                  <f.icon className={`h-7 w-7 ${f.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════ HOW IT WORKS ════════ */}
      <section className="relative py-24 md:py-32">
        <div className="absolute bottom-[10%] left-[-8%] w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-sm uppercase tracking-widest text-blue-400 mb-3">Qanday ishlaydi</p>
            <h2 className="text-4xl md:text-5xl font-extrabold">
              4 oddiy{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                qadam
              </span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative"
          >
            {/* timeline line */}
            <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 via-indigo-500/50 to-purple-500/50 hidden sm:block" />

            {[
              { step: 1, title: "Ro\u2018yxatdan o\u2018ting", desc: "Email va parol bilan tezkor ro\u2018yxatdan o\u2018tish.", icon: Users },
              { step: 2, title: "Testni tanlang", desc: "Fan va mavzu bo\u2018yicha kerakli testni toping.", icon: Target },
              { step: 3, title: "Testni ishlang", desc: "Timer ostida savollarni yeching, javoblaringizni yuboring.", icon: Timer },
              { step: 4, title: "Reytingni ko\u2018ring", desc: "Natijangiz va boshqalar bilan taqqoslang.", icon: Award },
            ].map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`relative flex items-start gap-6 mb-12 last:mb-0 sm:gap-8 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* number circle */}
                <div className="relative z-10 flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30 md:mx-auto">
                  {s.step}
                </div>
                {/* card */}
                <div
                  className={`flex-1 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 ${
                    i % 2 === 0 ? "md:text-right md:mr-8" : "md:text-left md:ml-8"
                  }`}
                >
                  <div className={`flex items-center gap-3 mb-2 ${i % 2 === 0 ? "md:justify-end" : ""}`}>
                    <s.icon className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-bold">{s.title}</h3>
                  </div>
                  <p className="text-gray-400 text-sm">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════ DASHBOARD PREVIEW ════════ */}
      <section className="relative py-24 md:py-32">
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[700px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-sm uppercase tracking-widest text-blue-400 mb-3">Real vaqt</p>
            <h2 className="text-4xl md:text-5xl font-extrabold">
              Live{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Leaderboard
              </span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-lg mx-auto">
              Har bir test va olimpiada uchun real vaqt reytingi. O&apos;z o&apos;rningizni darhol ko&apos;ring.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl shadow-black/40">
              {/* title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-3 text-xs text-gray-500">nextolymp.uz/leaderboard</span>
              </div>
              {/* fake leaderboard */}
              <div className="p-6">
                <div className="grid grid-cols-12 gap-4 text-xs uppercase tracking-wider text-gray-500 mb-4 px-4">
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
                    className={`grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-xl mb-2 ${
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
                    <div className="col-span-5 font-medium">{r.name}</div>
                    <div className="col-span-3 text-gray-400">{r.subject}</div>
                    <div className="col-span-3 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-400 px-3 py-1 text-sm font-semibold">
                        {r.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* gradient overlay at bottom */}
              <div className="h-16 bg-gradient-to-t from-gray-950/90 to-transparent -mt-16 relative z-10" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ COMMUNITY / CHAT ════════ */}
      <section className="relative py-24 md:py-32">
        <div className="absolute top-[20%] right-[-5%] w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-sm uppercase tracking-widest text-blue-400 mb-3">Jamiyat</p>
            <h2 className="text-4xl md:text-5xl font-extrabold">
              Learn together.{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Compete together.
              </span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
          >
            {[
              {
                name: "Sardor",
                message: "Bugun matematika testi juda qiziq ekan! 95 ball oldim.",
                time: "2 min oldin",
                color: "bg-blue-500",
                online: true,
              },
              {
                name: "Madina",
                message: "Kimyo olimpiadasiga kim qatnashyapti? Birgalikda tayyorlanamiz!",
                time: "5 min oldin",
                color: "bg-purple-500",
                online: true,
              },
              {
                name: "Jasur",
                message: "Reyting yangilandi, top 10 ga chiqdim!",
                time: "12 min oldin",
                color: "bg-green-500",
                online: false,
              },
              {
                name: "Nilufar",
                message: "Fizika bo\u2018yicha yangi testlar qo\u2018shildi, ko\u2018rdingizmi?",
                time: "20 min oldin",
                color: "bg-amber-500",
                online: true,
              },
            ].map((msg, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 hover:bg-white/[0.07] transition-all"
              >
                <div className="relative flex-shrink-0">
                  <div
                    className={`h-10 w-10 rounded-full ${msg.color} flex items-center justify-center text-white font-bold text-sm`}
                  >
                    {msg.name[0]}
                  </div>
                  {msg.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-gray-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{msg.name}</p>
                    <p className="text-xs text-gray-500">{msg.time}</p>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{msg.message}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex justify-center mt-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-2.5 text-sm text-gray-400">
              <MessageCircle className="h-4 w-4 text-blue-400" />
              24+ o&apos;quvchi hozir onlayn
            </div>
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
            {/* glow bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-purple-600/30" />
            <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-3xl animate-pulse" />
            {/* glass card */}
            <div className="relative z-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-16 md:px-16 md:py-20 text-center">
              <Award className="h-12 w-12 text-blue-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
                Bilimingizni sinashga tayyormisiz?
              </h2>
              <p className="text-gray-400 max-w-md mx-auto mb-10 text-lg">
                Hoziroq ro&apos;yxatdan o&apos;ting va minglab o&apos;quvchilar bilan birga o&apos;z bilimingizni sinab ko&apos;ring.
              </p>
              <Link href="/register">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-10 py-4 text-lg font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow cursor-pointer"
                >
                  Ro&apos;yxatdan o&apos;tish
                  <ArrowRight className="h-5 w-5" />
                </motion.div>
              </Link>
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
              <h3 className="text-2xl font-extrabold mb-3">
                Next<span className="text-blue-400">Olymp</span>
              </h3>
              <p className="text-gray-500 max-w-sm leading-relaxed">
                O&apos;zbekiston bo&apos;ylab o&apos;quvchilarni olimpiada va imtihonlarga tayyorlash uchun yaratilgan zamonaviy onlayn test platformasi.
              </p>
            </div>

            {/* links */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Platforma</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Mock testlar", href: "/dashboard/mock-tests" },
                  { label: "Olimpiadalar", href: "/dashboard" },
                  { label: "Reyting", href: "/dashboard/leaderboard" },
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
            <div className="flex items-center gap-1 text-gray-600 text-sm">
              <Zap className="h-3.5 w-3.5" />
              Built for learners
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
