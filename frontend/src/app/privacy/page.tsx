"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#06060A] text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Bosh sahifaga qaytish
        </Link>

        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <h1 className="text-3xl font-bold mb-2">Maxfiylik siyosati</h1>
          <p className="text-white/40 text-sm mb-10">
            Oxirgi yangilanish: 2026-yil, 21-mart
          </p>

          <div className="space-y-8 text-white/70 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                1. Kirish
              </h2>
              <p>
                NextOlymp platformasi foydalanuvchilarning shaxsiy
                ma&apos;lumotlarini himoya qilishga jiddiy yondashadi. Ushbu
                maxfiylik siyosati qanday ma&apos;lumotlar to&apos;planishi,
                qanday ishlatilishi va qanday himoya qilinishini tushuntiradi.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                2. To&apos;planadigan ma&apos;lumotlar
              </h2>
              <p className="mb-3">
                Platformadan foydalanish jarayonida quyidagi ma&apos;lumotlar
                to&apos;planadi:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-white">
                    Shaxsiy ma&apos;lumotlar:
                  </strong>{" "}
                  ism, familiya, tug&apos;ilgan sana, jinsi, viloyat, tuman,
                  maktab nomi, sinf
                </li>
                <li>
                  <strong className="text-white">Hisob ma&apos;lumotlari:</strong>{" "}
                  foydalanuvchi nomi (username), parol (shifrlangan holda)
                </li>
                <li>
                  <strong className="text-white">Biometrik ma&apos;lumotlar:</strong>{" "}
                  profil rasmi (yuz tasviri), AI proctoring paytida kamera
                  tasvirlari
                </li>
                <li>
                  <strong className="text-white">
                    Foydalanish ma&apos;lumotlari:
                  </strong>{" "}
                  olimpiada natijalari, test javoblari, faollik vaqtlari
                </li>
                <li>
                  <strong className="text-white">Texnik ma&apos;lumotlar:</strong>{" "}
                  qurilma turi, IP manzil, brauzer versiyasi
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                3. Ma&apos;lumotlardan foydalanish
              </h2>
              <p className="mb-3">
                To&apos;plangan ma&apos;lumotlar quyidagi maqsadlarda
                ishlatiladi:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Foydalanuvchi hisobini yaratish va boshqarish
                </li>
                <li>
                  Olimpiadalarga ro&apos;yxatdan o&apos;tkazish va natijalarni
                  hisoblash
                </li>
                <li>
                  Anti-cheat va AI proctoring tizimlarini ishlatish — test
                  paytida adolatni ta&apos;minlash
                </li>
                <li>
                  Sertifikatlar yaratish va natijalarni tasdiqlash
                </li>
                <li>
                  Platforma xavfsizligini ta&apos;minlash
                </li>
                <li>
                  Xizmat sifatini yaxshilash va statistik tahlil
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                4. Kamera va AI proctoring
              </h2>
              <p>
                Test vaqtida ilova kamerangizdan foydalanadi. Bu faqat
                quyidagi maqsadlarda amalga oshiriladi:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  Profil rasmidagi shaxs test topshirayotgan shaxs ekanligini
                  tasdiqlash
                </li>
                <li>
                  Test paytida yuzning mavjudligini tekshirish (yuz
                  ko&apos;rinmasa ogohlantirish)
                </li>
                <li>
                  Bir nechta shaxs ishtirokini aniqlash
                </li>
              </ul>
              <p className="mt-3">
                Kamera tasvirlari serverga <strong className="text-white">saqlanmaydi</strong> —
                faqat qurilmada real vaqtda qayta ishlanadi.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                5. Ma&apos;lumotlar xavfsizligi
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Parollar BCrypt algoritmida shifrlangan holda saqlanadi
                </li>
                <li>
                  API so&apos;rovlari JWT token orqali autentifikatsiya qilinadi
                </li>
                <li>
                  Ma&apos;lumotlar bazasi shifrlangan ulanish orqali
                  himoyalangan
                </li>
                <li>
                  Foydalanuvchi ma&apos;lumotlariga faqat vakolatli xodimlar
                  kirishi mumkin
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                6. Uchinchi tomonlar
              </h2>
              <p>
                Biz foydalanuvchilarning shaxsiy ma&apos;lumotlarini uchinchi
                tomonlarga sotmaymiz yoki bermaymiz. Faqat quyidagi
                holatlarda ma&apos;lumot berilishi mumkin:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Qonun talab qilgan hollarda</li>
                <li>
                  Foydalanuvchining roziligi bilan (masalan, sertifikat
                  tekshirish uchun)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                7. Foydalanuvchi huquqlari
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  O&apos;z ma&apos;lumotlaringizni ko&apos;rish va tahrirlash
                  huquqiga egasiz
                </li>
                <li>
                  Hisobingizni o&apos;chirishni so&apos;rash huquqiga egasiz
                </li>
                <li>
                  Ma&apos;lumotlaringiz qanday ishlatilayotgani haqida
                  so&apos;rash huquqiga egasiz
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                8. Cookie va mahalliy saqlash
              </h2>
              <p>
                Platforma autentifikatsiya tokenlari va foydalanuvchi
                sozlamalarini saqlash uchun cookie va localStorage
                texnologiyalaridan foydalanadi. Bu platformaning
                to&apos;g&apos;ri ishlashi uchun zarur.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                9. Bolalar maxfiyligi
              </h2>
              <p>
                Platforma ta&apos;lim maqsadlarida ishlatilganligi sababli,
                voyaga yetmaganlar foydalanishi mumkin. Biz bolalarning
                ma&apos;lumotlarini alohida ehtiyotkorlik bilan himoya qilamiz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                10. Aloqa
              </h2>
              <p>
                Maxfiylik bo&apos;yicha savollar uchun:{" "}
                <a
                  href="mailto:support@nextolympia.uz"
                  className="text-blue-400 hover:underline"
                >
                  support@nextolympia.uz
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
