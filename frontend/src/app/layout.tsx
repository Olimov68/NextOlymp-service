import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { Providers } from "@/lib/providers";
import { AuthProvider } from "@/lib/auth-context";
import { SettingsProvider } from "@/lib/settings-context";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nextoly.uz";

export const metadata: Metadata = {
  title: {
    default: "NextOly — Xalqaro Online Olimpiada Platformasi",
    template: "%s | NextOly",
  },
  description: "Xalqaro akademik olimpiadalarni tashkil etish va ularda ishtirok etish uchun professional va xavfsiz platforma. 20+ mamlakat, 75,000+ ishtirokchi.",
  keywords: ["olimpiada", "online olimpiada", "xalqaro olimpiada", "matematika olimpiada", "nextoly", "akademik musobaqa", "test", "uzbekistan"],
  authors: [{ name: "NextOly" }],
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: siteUrl,
    siteName: "NextOly",
    title: "NextOly — Xalqaro Online Olimpiada Platformasi",
    description: "Xalqaro akademik olimpiadalarni tashkil etish va ularda ishtirok etish uchun professional va xavfsiz platforma.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NextOly — Olimpiada Platformasi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NextOly — Xalqaro Online Olimpiada Platformasi",
    description: "Xalqaro akademik olimpiadalarni tashkil etish va ularda ishtirok etish uchun professional platforma.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%234F46E5'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='18' font-weight='bold' fill='white'>N</text></svg>", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add('dark');`,
        }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers>
          <SettingsProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </SettingsProvider>
        </Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
