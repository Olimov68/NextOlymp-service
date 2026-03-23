"use client";

import Link from "next/link";
import { Zap, Send, Instagram, ChevronRight, Smartphone, Monitor, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="relative border-t border-white/5 bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-2xl font-extrabold">
                Next<span className="text-blue-400">Olymp</span>
              </h3>
            </div>
            <p className="text-gray-500 max-w-sm leading-relaxed mb-4">
              {t("footer.desc")}
            </p>
            <a href="mailto:support@nextolymp.uz" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6">
              <Mail className="h-4 w-4" />
              support@nextolymp.uz
            </a>
            <div className="flex items-center gap-3">
              <a href="https://t.me/nextolymp" target="_blank" rel="noreferrer" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all" aria-label="Telegram">
                <Send className="h-4 w-4" />
              </a>
              <a href="https://instagram.com/nextolymp" target="_blank" rel="noreferrer" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">{t("footer.platform")}</h4>
            <ul className="space-y-2.5">
              {[
                { label: t("footer.mock_tests"), href: "/dashboard/mock-tests" },
                { label: t("footer.olympiads_link"), href: "/dashboard/olympiads" },
                { label: t("footer.rating_link"), href: "/dashboard/leaderboard" },
                { label: t("footer.blog_link"), href: "/news" },
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
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">{t("footer.apps")}</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="https://play.google.com/store/apps/details?id=com.nextolymp" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors text-sm flex items-center gap-1.5">
                  <Smartphone className="h-3 w-3" />
                  {t("footer.android_app")}
                </a>
              </li>
              <li>
                <a href="https://nextolymp.uz/download/windows" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors text-sm flex items-center gap-1.5">
                  <Monitor className="h-3 w-3" />
                  {t("footer.windows_app")}
                </a>
              </li>
            </ul>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 mt-6">{t("footer.useful")}</h4>
            <ul className="space-y-2.5">
              {[
                { label: t("footer.certificate_link"), href: "/verify-certificate" },
                { label: t("footer.privacy"), href: "/privacy" },
                { label: t("footer.terms"), href: "/terms" },
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
            &copy; {new Date().getFullYear()} NextOlymp. {t("footer.rights")}
          </p>
          <div className="flex items-center gap-4 text-gray-600 text-sm">
            <a href="/privacy" className="hover:text-gray-400 transition-colors">{t("footer.privacy")}</a>
            <span className="text-gray-800">|</span>
            <a href="/terms" className="hover:text-gray-400 transition-colors">{t("footer.terms")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
