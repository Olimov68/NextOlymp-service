"use client";

import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { MissionSection } from "@/components/landing/MissionSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { NewsSection } from "@/components/landing/NewsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";
import { useSettings } from "@/lib/settings-context";

export default function Home() {
  const settings = useSettings();

  if (settings.maintenance_mode) {
    return <MaintenanceBanner />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50">
        <AnnouncementBar />
        <Header />
      </div>
      <main>
        <HeroSection />
        <BenefitsSection />
        <MissionSection />
        <FeaturesSection />
        <HowItWorksSection />
        <NewsSection />
        <TestimonialsSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}
