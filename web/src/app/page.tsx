import { CategoriesSection } from "@/components/landing/categories-section";
import { GreenFleetSection } from "@/components/landing/green-fleet";
import { LandingHeader } from "@/components/landing/header";
import { LandingHero } from "@/components/landing/hero";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { LandingFooter } from "@/components/landing/footer";
import { PartnerCardsSection } from "@/components/landing/partner-cards";
import { WaitlistSection } from "@/components/landing/waitlist-section";

export default function Home() {
  return (
    <>
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <CategoriesSection />
        <GreenFleetSection />
        <HowItWorksSection />
        <PartnerCardsSection />
        <WaitlistSection />
      </main>
      <LandingFooter />
    </>
  );
}
