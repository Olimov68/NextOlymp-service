"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

/**
 * Jivo Chat widget — faqat ommaviy sahifalarda ko'rsatiladi.
 * Admin panel, superadmin, dashboard sahifalarida ko'rinmaydi (xavfsizlik uchun).
 */
export function JivoChat() {
  const pathname = usePathname();

  // Admin, superadmin, dashboard sahifalarida Jivo Chat ko'rsatilmasin
  const hiddenPaths = ["/admin", "/superadmin"];
  const shouldHide = hiddenPaths.some((p) => pathname.startsWith(p));

  if (shouldHide) return null;

  return <Script src="//code.jivo.ru/widget/GovfNB8EWK" strategy="lazyOnload" />;
}
