import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const rules = [
  {
    q: "Olimpiadada kim qatnashishi mumkin?",
    a: "Barcha 7-11 sinf o'quvchilari olimpiadadada qatnashishlari mumkin. Yosh chegarasi 12-18 yosh.",
  },
  {
    q: "Ro'yxatdan o'tish qanday amalga oshiriladi?",
    a: "Platformada ro'yxatdan o'ting, kerakli olimpiadani tanlang va 'Qatnashish' tugmasini bosing. Bepul olimpiadalar uchun to'lov talab qilinmaydi.",
  },
  {
    q: "Olimpiada qanday formatda o'tkaziladi?",
    a: "Barcha olimpiadalar onlayn formatda o'tkaziladi. Belgilangan vaqtda tizimga kirib, savollarni yechishingiz kerak. Vaqt cheklovi mavjud.",
  },
  {
    q: "Natijalar qachon e'lon qilinadi?",
    a: "Natijalar olimpiada yakunlangandan so'ng 3-5 ish kuni ichida e'lon qilinadi va platformada joylashtiriladi.",
  },
  {
    q: "Medal va sertifikatlar qanday beriladi?",
    a: "Elektron sertifikatlar shaxsiy kabinetingizga yuklanadi. Medal sovrindorlari uchun bosma sertifikatlar pochta orqali yuboriladi.",
  },
  {
    q: "Texnik muammo yuzaga kelsa nima qilish kerak?",
    a: "Texnik muammolar yuzaga kelganda info@nextoly.com manziliga yoki Telegram kanalimizga murojaat qiling. 24/7 qo'llab-quvvatlash xizmati mavjud.",
  },
];

export function RulesSection() {
  return (
    <section id="rules" className="py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm text-gray-700 mb-4">
            📋 Nizomlar
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Nizomlar</h2>
          <p className="text-gray-600">
            {"Ko'p beriladigan savollar va olimpiada qoidalari"}
          </p>
        </div>

        <Accordion className="space-y-3">
          {rules.map((rule, i) => (
            <AccordionItem key={i} className="rounded-xl border bg-white shadow-sm px-6">
              <AccordionTrigger className="text-left font-medium text-gray-900 hover:no-underline">
                {rule.q}
              </AccordionTrigger>
              <AccordionContent className="text-gray-500">
                {rule.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
