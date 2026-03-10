"use client";

import { useI18n } from "@/lib/i18n";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const rulesData = {
  uz: [
    { q: "Olimpiadada kim qatnashishi mumkin?", a: "Barcha 7-11 sinf o'quvchilari olimpiadadada qatnashishlari mumkin. Yosh chegarasi 12-18 yosh." },
    { q: "Ro'yxatdan o'tish qanday amalga oshiriladi?", a: "Platformada ro'yxatdan o'ting, kerakli olimpiadani tanlang va 'Qatnashish' tugmasini bosing. Bepul olimpiadalar uchun to'lov talab qilinmaydi." },
    { q: "Olimpiada qanday formatda o'tkaziladi?", a: "Barcha olimpiadalar onlayn formatda o'tkaziladi. Belgilangan vaqtda tizimga kirib, savollarni yechishingiz kerak. Vaqt cheklovi mavjud." },
    { q: "Natijalar qachon e'lon qilinadi?", a: "Natijalar olimpiada yakunlangandan so'ng 3-5 ish kuni ichida e'lon qilinadi va platformada joylashtiriladi." },
    { q: "Medal va sertifikatlar qanday beriladi?", a: "Elektron sertifikatlar shaxsiy kabinetingizga yuklanadi. Medal sovrindorlari uchun bosma sertifikatlar pochta orqali yuboriladi." },
    { q: "Texnik muammo yuzaga kelsa nima qilish kerak?", a: "Texnik muammolar yuzaga kelganda info@nextolymp.uz manziliga yoki Telegram kanalimizga murojaat qiling. 24/7 qo'llab-quvvatlash xizmati mavjud." },
  ],
  ru: [
    { q: "Кто может участвовать в олимпиаде?", a: "Все учащиеся 7-11 классов могут участвовать в олимпиаде. Возрастные ограничения: 12-18 лет." },
    { q: "Как зарегистрироваться?", a: "Зарегистрируйтесь на платформе, выберите нужную олимпиаду и нажмите 'Участвовать'. Для бесплатных олимпиад оплата не требуется." },
    { q: "В каком формате проводится олимпиада?", a: "Все олимпиады проводятся в онлайн-формате. В назначенное время войдите в систему и решайте задания. Действует ограничение по времени." },
    { q: "Когда объявляются результаты?", a: "Результаты объявляются в течение 3-5 рабочих дней после завершения олимпиады и размещаются на платформе." },
    { q: "Как выдаются медали и сертификаты?", a: "Электронные сертификаты загружаются в ваш личный кабинет. Для медалистов печатные сертификаты отправляются по почте." },
    { q: "Что делать при техническом сбое?", a: "При технических проблемах обращайтесь на info@nextolymp.uz или в наш Telegram-канал. Служба поддержки работает 24/7." },
  ],
  en: [
    { q: "Who can participate in the olympiad?", a: "All students in grades 7-11 can participate. Age requirement: 12-18 years old." },
    { q: "How to register?", a: "Register on the platform, select the desired olympiad and click 'Participate'. No payment required for free olympiads." },
    { q: "What is the olympiad format?", a: "All olympiads are conducted online. Log in at the scheduled time and solve the problems. There is a time limit." },
    { q: "When are results announced?", a: "Results are announced within 3-5 business days after the olympiad ends and are posted on the platform." },
    { q: "How are medals and certificates awarded?", a: "Electronic certificates are uploaded to your personal dashboard. Printed certificates for medalists are sent by mail." },
    { q: "What to do in case of technical issues?", a: "Contact info@nextolymp.uz or our Telegram channel for technical issues. 24/7 support service is available." },
  ],
};

export function RulesSection() {
  const { lang, t } = useI18n();
  const rules = rulesData[lang] || rulesData.uz;

  return (
    <section id="rules" className="py-20 bg-gradient-to-b from-blue-950 to-indigo-950">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm text-blue-200/70 mb-4">
            {t("nav.rules")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("nav.rules")}</h2>
        </div>

        <Accordion className="space-y-3">
          {rules.map((rule, i) => (
            <AccordionItem key={i} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg px-6">
              <AccordionTrigger className="text-left font-medium text-white hover:no-underline hover:text-blue-300 transition-colors">
                {rule.q}
              </AccordionTrigger>
              <AccordionContent className="text-blue-200/50">
                {rule.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
