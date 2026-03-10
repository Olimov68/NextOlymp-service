"use client";

import { useI18n } from "@/lib/i18n";

export function AboutSection() {
  const { t } = useI18n();

  return (
    <section id="about" className="py-20 bg-gradient-to-b from-indigo-950 to-blue-950">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-sm text-sky-300 mb-4">
            {t("about.badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("about.title")}</h2>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-2xl space-y-4 text-blue-200/50 leading-relaxed">
          <p>
            <strong className="text-white">NextOly</strong> — {t("about.p1")}
          </p>
          <p>{t("about.p2")}</p>
          <p>{t("about.p3")}</p>
          <p>{t("about.p4")}</p>
        </div>
      </div>
    </section>
  );
}
