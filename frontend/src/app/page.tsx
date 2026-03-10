import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { OlympiadsSection } from "@/components/landing/OlympiadsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CertificateSection } from "@/components/landing/CertificateSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { AnnouncementsSection } from "@/components/landing/AnnouncementsSection";
import { NewsSection } from "@/components/landing/NewsSection";
import { ResultsSection } from "@/components/landing/ResultsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { TeamSection } from "@/components/landing/TeamSection";
import { RulesSection } from "@/components/landing/RulesSection";
import { OrganizersSection } from "@/components/landing/OrganizersSection";
import { PartnersSection } from "@/components/landing/PartnersSection";
import { AboutSection } from "@/components/landing/AboutSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main>
        <HeroSection />
        <OlympiadsSection />
        <FeaturesSection />
        <CertificateSection />
        <HowItWorksSection />
        <AnnouncementsSection />
        <NewsSection />
        <ResultsSection />
        <TestimonialsSection />
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
