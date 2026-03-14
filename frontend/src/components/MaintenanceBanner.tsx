"use client";

import { useSettings } from "@/lib/settings-context";
import { Wrench, Mail } from "lucide-react";

export function MaintenanceBanner() {
  const settings = useSettings();
  const platformName = settings.platform_name || "NextOly";
  const supportEmail = settings.support_email;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-3xl shadow-lg shadow-blue-500/25">
            N
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Wrench className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground">
          Texnik xizmat rejimi
        </h1>

        {/* Description */}
        <p className="text-lg text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">{platformName}</span> platformasi hozirda texnik xizmat rejimida.
          Iltimos, keyinroq qayta urinib ko&apos;ring.
        </p>

        <p className="text-sm text-muted-foreground">
          Platformani yanada yaxshilash uchun ishlar olib borilmoqda.
        </p>

        {/* Support email */}
        {supportEmail && (
          <div className="pt-4">
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              {supportEmail}
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
