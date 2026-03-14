import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { AuthProvider } from "@/lib/auth-context";
import { SettingsProvider } from "@/lib/settings-context";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NextOly — Xalqaro Online Olimpiada Platformasi",
  description: "Xalqaro akademik olimpiadalarni tashkil etish va ularda ishtirok etish uchun professional va xavfsiz platforma. 20+ mamlakat, 75,000+ ishtirokchi.",
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
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {
                document.documentElement.classList.add('dark');
              }
            })();
          `,
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
        <Script src="//code.jivo.ru/widget/GovfNB8EWK" strategy="lazyOnload" />
      </body>
    </html>
  );
}
