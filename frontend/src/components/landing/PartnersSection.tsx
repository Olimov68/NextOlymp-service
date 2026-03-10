"use client";

import { useI18n } from "@/lib/i18n";

const partners = [
  "UNICEF", "British Council", "Samsung", "Google Education",
  "Khan Academy", "UNESCO", "Coursera", "MIT OpenCourseWare",
];

export function PartnersSection() {
  const { t } = useI18n();

  return (
    <section id="partners" className="py-20 bg-gradient-to-b from-blue-950 to-indigo-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm text-teal-300 mb-4">
            {t("nav.partners")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("nav.partners")}</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {partners.map((p) => (
            <div
              key={p}
              className="flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm text-white font-semibold hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:bg-white/10 transition-all duration-300"
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
