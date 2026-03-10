"use client";

import { useI18n } from "@/lib/i18n";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="bg-gray-950 text-gray-400 py-14">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                NO
              </div>
              <span className="text-xl font-bold text-white">NextOly</span>
            </div>
            <p className="text-sm leading-relaxed">
              {t("footer.desc") || "Xalqaro akademik olimpiadalarni tashkil etish va ularda ishtirok etish uchun professional platforma."}
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t("footer.platform") || "Platforma"}</h3>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#olympiads" className="hover:text-white transition-colors">{t("nav.olympiads")}</a></li>
              <li><a href="#results" className="hover:text-white transition-colors">{t("nav.results")}</a></li>
              <li><a href="#news" className="hover:text-white transition-colors">{t("nav.news")}</a></li>
              <li><a href="#announcements" className="hover:text-white transition-colors">{t("nav.announcements")}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t("footer.info") || "Ma'lumot"}</h3>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#about" className="hover:text-white transition-colors">{t("nav.about")}</a></li>
              <li><a href="#team" className="hover:text-white transition-colors">{t("nav.team")}</a></li>
              <li><a href="#rules" className="hover:text-white transition-colors">{t("nav.rules")}</a></li>
              <li><a href="#partners" className="hover:text-white transition-colors">{t("nav.partners")}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t("footer.contact") || "Bog'lanish"}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-blue-400" /> info@nextolymp.uz</li>
              <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-blue-400" /> +998 91 562 7229</li>
              <li className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-blue-400" /> Toshkent, O&apos;zbekiston</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800/50 mt-10 pt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} NextOly. {t("footer.rights") || "Barcha huquqlar himoyalangan."}
        </div>
      </div>
    </footer>
  );
}
