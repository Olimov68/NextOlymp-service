"use client";

import { useI18n } from "@/lib/i18n";
import { MessageCircle } from "lucide-react";

const messages: Record<string, string> = {
  uz: "Bu sayt hozirda test holatida ishlayapti. Agar biron bir muammoga duch kelsangiz, admin bilan bog'laning: @bakhodirovich_ao",
  ru: "Этот сайт работает в тестовом режиме. Если вы столкнулись с проблемой, свяжитесь с админом: @bakhodirovich_ao",
  en: "This site is currently in test mode. If you encounter any issues, please contact the admin: @bakhodirovich_ao",
};

export function AnnouncementBar() {
  const { lang } = useI18n();
  const text = messages[lang] || messages.uz;

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 py-2">
      <div className="flex items-center whitespace-nowrap animate-marquee">
        {[0, 1, 2].map((i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-12 text-sm font-medium text-white/90">
            <MessageCircle className="h-4 w-4 text-yellow-300 shrink-0" />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
