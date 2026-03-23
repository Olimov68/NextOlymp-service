import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { AuthProvider } from "@/lib/auth-context";
import { SettingsProvider } from "@/lib/settings-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NextOlymp — Online Olimpiada va Mock Test Platformasi",
    template: "%s | NextOlymp",
  },
  description: "O'quvchilar va talabalar uchun professional online olimpiada, mock test va ta'lim platformasi. Xavfsiz, tez va zamonaviy.",
  keywords: ["olimpiada", "mock test", "online test", "ta'lim", "NextOlymp", "education", "olympiad"],
  authors: [{ name: "NextOlymp Team" }],
  creator: "NextOlymp",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: "/",
    siteName: "NextOlymp",
    title: "NextOlymp — Online Olimpiada va Mock Test Platformasi",
    description: "O'quvchilar va talabalar uchun professional online olimpiada, mock test va ta'lim platformasi.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NextOlymp Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NextOlymp — Online Olimpiada Platformasi",
    description: "Professional online olimpiada va mock test platformasi.",
  },
  robots: {
    index: true,
    follow: true,
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
    <html lang="uz" className="dark" suppressHydrationWarning>
      <head />
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers>
          <SettingsProvider>
            <AuthProvider>
              <ErrorBoundary>
                <MaintenanceGuard>
                  {children}
                </MaintenanceGuard>
              </ErrorBoundary>
            </AuthProvider>
          </SettingsProvider>
        </Providers>
        <Toaster richColors position="top-right" />
        <Script src="//code.jivo.ru/widget/GovfNB8EWK" strategy="lazyOnload" />
      </body>
    </html>
  );
}
