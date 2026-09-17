/*
  SponsorMarquee — infinitely auto-scrolling strip
  Uses a CSS animation (no JS scroll events) for smooth, gap-free looping.
  Content is duplicated so the second copy seamlessly continues the first.
*/

const ITEMS = [
  '✦ Sponsored by',
  'Thapar Institute',
  '✦ AuroraFest 2026',
  'Student Council TIET',
  '✦ IIT Bombay',
  'Hackathon Partner',
  '✦ Google Developer Groups',
  'RedBull Campus',
  '✦ Unstop',
  'Devfolio',
  '✦ GitHub Education',
  'Figma for Students',
];

export default function SponsorMarquee() {
  return (
    <div className="relative overflow-hidden border-y-2 border-[#1A1A1A] bg-[#F06E38]" style={{ height: 56 }}>
      {/* Scrolling track — duplicated for seamless loop */}
      <div
        className="flex items-center absolute top-0 left-0 whitespace-nowrap"
        style={{
          animation: 'marquee-scroll 28s linear infinite',
          height: '100%',
        }}
      >
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center text-white font-fredoka font-bold text-sm sm:text-base tracking-wide px-6"
          >
            {item}
          </span>
        ))}
      </div>

      {/* Edge fade masks */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#F06E38] to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#F06E38] to-transparent pointer-events-none z-10" />

      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
