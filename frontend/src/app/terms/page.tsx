"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold mb-2">Foydalanish shartlari</h1>
          <p className="text-white/40 text-sm mb-10">
            Oxirgi yangilanish: 2026-yil, 21-mart
          </p>

          <div className="space-y-8 text-white/70 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                1. Umumiy qoidalar
              </h2>
              <p>
                NextOlymp platformasi ({'"'}Platforma{'"'}) — bu onlayn olimpiadalarni
                tashkil etish va o&apos;tkazish uchun mo&apos;ljallangan xizmat.
                Platformadan foydalanish orqali siz ushbu shartlarga rozilik
                bildirasiz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                2. Ro&apos;yxatdan o&apos;tish
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Platformadan foydalanish uchun ro&apos;yxatdan o&apos;tish
                  majburiy.
                </li>
                <li>
                  Foydalanuvchi haqiqiy shaxsiy ma&apos;lumotlarini (ism,
                  familiya, maktab, sinf, viloyat) kiritishi shart.
                </li>
                <li>
                  Ro&apos;yxatdan o&apos;tishda yuz rasmi yuklanishi va AI
                  tizimi tomonidan tasdiqlanishi kerak.
                </li>
                <li>
                  Bitta shaxs faqat bitta hisob yaratishi mumkin. Bir nechta
                  hisob yaratish ta&apos;qiqlanadi.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                3. Olimpiadalarda ishtirok etish
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Olimpiadaga ro&apos;yxatdan o&apos;tgan foydalanuvchi
                  belgilangan vaqtda ishtirok etishi shart.
                </li>
                <li>
                  Test davomida anti-cheat tizimi faol bo&apos;ladi: ilovadan
                  chiqish, ekranni yozish, boshqa ilovaga o&apos;tish
                  ta&apos;qiqlanadi.
                </li>
                <li>
                  AI proctoring tizimi kamera orqali foydalanuvchini kuzatadi.
                  Qoidabuzarlik aniqlansa, natija bekor qilinishi mumkin.
                </li>
                <li>
                  Boshqa shaxsdan yordam olish, javoblarni nusxalash yoki
                  tashqi resurslardan foydalanish qat&apos;iyan man etiladi.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                4. Taqiqlangan harakatlar
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Soxta ma&apos;lumotlar bilan ro&apos;yxatdan o&apos;tish</li>
                <li>Boshqa shaxs nomidan ishtirok etish</li>
                <li>
                  Tizimni buzishga urinish (hacking, DDoS, exploit)
                </li>
                <li>
                  Chat yoki muhokamada haqorat, spam, noqonuniy kontent joylashtirish
                </li>
                <li>Platformani tijorat maqsadlarida ruxsatsiz ishlatish</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                5. Hisobni bloklash
              </h2>
              <p>
                Qoidalarni buzgan foydalanuvchining hisobi vaqtinchalik yoki
                doimiy bloklanishi mumkin. Bloklash sabablari:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Anti-cheat tizimi qoidabuzarlik aniqlasa</li>
                <li>Soxta ma&apos;lumotlar kiritilsa</li>
                <li>Boshqa foydalanuvchilarga zarar yetkazilsa</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                6. To&apos;lovlar
              </h2>
              <p>
                Ba&apos;zi olimpiadalar pullik bo&apos;lishi mumkin.
                To&apos;langan mablag&apos; qaytarilmaydi, faqat texnik xatolik
                bo&apos;lgan holatlarda istisno. Bepul olimpiadalarga hech
                qanday to&apos;lovsiz ishtirok etish mumkin.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                7. Javobgarlik chegarasi
              </h2>
              <p>
                Platforma texnik nosozliklar, internet uzilishi yoki
                foydalanuvchi qurilmasi bilan bog&apos;liq muammolar uchun
                javobgar emas. Biz xizmat sifatini oshirish uchun doimiy
                ishlashga harakat qilamiz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                8. O&apos;zgarishlar
              </h2>
              <p>
                Biz ushbu shartlarni istalgan vaqtda o&apos;zgartirish huquqini
                saqlaymiz. O&apos;zgarishlar platforma orqali e&apos;lon
                qilinadi.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                9. Aloqa
              </h2>
              <p>
                Savollar bo&apos;lsa, biz bilan bog&apos;laning:{" "}
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
