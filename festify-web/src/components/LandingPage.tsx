import Hero from './Hero';
import PhotoCardSection from './PhotoCardSection';
import SponsorMarquee from './SponsorMarquee';
import LandingFooter from './LandingFooter';

interface LandingPageProps {
  onOpenAdmin: () => void;
  onOpenUserSide: () => void;
}

export default function LandingPage({ onOpenAdmin, onOpenUserSide }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#F7F2E7] text-[#1A1A1A] font-fredoka antialiased selection:bg-[#EC6484] selection:text-white overflow-x-hidden">
      {/* Hero with intro animation */}
      <Hero onOpenAdmin={onOpenAdmin} onOpenUserSide={onOpenUserSide} />

      {/* Section A — Shuffleable photo card with vertical rainbow stripes */}
      <PhotoCardSection />

      {/* Section B — Infinite sponsor marquee strip */}
      <SponsorMarquee />

      {/* Section C — Dark footer with mascot + bleeding rainbow stripes */}
      <LandingFooter onOpenAdmin={onOpenAdmin} onOpenUserSide={onOpenUserSide} />
    </div>
  );
}
