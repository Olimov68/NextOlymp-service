import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { OlympiadsSection } from "@/components/landing/OlympiadsSection";
import { AnnouncementsSection } from "@/components/landing/AnnouncementsSection";
import { NewsSection } from "@/components/landing/NewsSection";
import { ResultsSection } from "@/components/landing/ResultsSection";
import { TeamSection } from "@/components/landing/TeamSection";
import { RulesSection } from "@/components/landing/RulesSection";
import { OrganizersSection } from "@/components/landing/OrganizersSection";
import { PartnersSection } from "@/components/landing/PartnersSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { CertificateSection } from "@/components/landing/CertificateSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-[1440px]">
        <HeroSection />
        <OlympiadsSection />
        <AnnouncementsSection />
        <NewsSection />
        <ResultsSection />
        <CertificateSection />
        <TeamSection />
        <RulesSection />
        <OrganizersSection />
        <PartnersSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}
