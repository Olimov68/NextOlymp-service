"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { useI18n, type Lang } from "@/lib/i18n";

const languages: { code: Lang; label: string }[] = [
  { code: "uz", label: "UZ" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();

  const menuItems = [
    { label: t("nav.olympiads"), href: "#olympiads" },
    { label: t("nav.announcements"), href: "#announcements" },
    { label: t("nav.news"), href: "#news" },
    { label: t("nav.results"), href: "#results" },
    { label: t("nav.team"), href: "#team" },
    { label: t("nav.rules"), href: "#rules" },
    { label: t("nav.organizers"), href: "#organizers" },
    { label: t("nav.partners"), href: "#partners" },
    { label: t("nav.about"), href: "#about" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl">🏆</div>
          <span className="text-xl font-bold text-gray-900">NextOly</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center rounded-lg border bg-gray-50 overflow-hidden">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  lang === l.code
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Link href={user.role === "admin" ? "/admin" : "/dashboard"}>
                <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                  {t("nav.dashboard")}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} className="hidden sm:inline-flex">
                {t("nav.logout")}
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm" className="gap-1">
                  <LogIn className="h-4 w-4" />
                  {t("nav.login")}
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:inline-flex">
                <Button size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="h-4 w-4" />
                  {t("nav.register")}
                </Button>
              </Link>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <nav className="flex flex-col gap-1 mt-8">
                {!user && (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50">
                      {t("nav.login")}
                    </Link>
                    <Link href="/register" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-sm font-medium text-white bg-blue-600 text-center mb-2">
                      {t("nav.register")}
                    </Link>
                  </>
                )}
                {user && (
                  <Link
                    href={user.role === "admin" ? "/admin" : "/dashboard"}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 mb-2"
                  >
                    {t("nav.dashboard")} ({user.firstName})
                  </Link>
                )}
                {menuItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
