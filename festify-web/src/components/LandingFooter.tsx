import { motion } from 'framer-motion';

// Shortened rainbow stripes that bleed down from the marquee, fading out
function FooterStripes({ side }: { side: 'left' | 'right' }) {
  const colors =
    side === 'left'
      ? ['#EC6484', '#F4C430', '#F06E38', '#D94E28']
      : ['#D94E28', '#F06E38', '#F4C430', '#EC6484'];

  return (
    <div
      className={`absolute top-0 ${side === 'left' ? 'left-0' : 'right-0'} w-20 sm:w-28 md:w-36 pointer-events-none z-0`}
      style={{ height: 240 }}
    >
      <div
        className="w-full h-full flex"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
        }}
      >
        {colors.map((c, i) => (
          <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );
}

const FOOTER_LINKS = ['About', 'Website Gallery', 'FAQs', 'Privacy', 'Help Desk'];

export default function LandingFooter({ onOpenAdmin, onOpenUserSide }: { onOpenAdmin: () => void; onOpenUserSide: () => void }) {
  return (
    <footer className="relative bg-[#1A1A1A] text-[#F7F2E7] overflow-hidden border-t-2 border-[#1A1A1A]">
      {/* Rainbow stripes bleeding down from marquee */}
      <FooterStripes side="left" />
      <FooterStripes side="right" />

      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">

          {/* Left: Mascot badge + wordmark */}
          <div className="flex items-center gap-5">
            <motion.div
              whileHover={{ rotate: 20, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14 }}
              className="w-14 h-14 rounded-full bg-[#EC6484] border-2 border-dashed border-[#F4C430] flex items-center justify-center text-[#F4C430] text-2xl shadow-[3px_3px_0px_#F4C430] shrink-0 cursor-pointer"
              title="Festify"
            >
              <span style={{ fontFamily: 'Shrikhand, cursive' }}>✉</span>
            </motion.div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#F7F2E7]/40 mb-1">
                Postmarked from
              </p>
              <h2
                className="text-4xl font-black leading-none text-[#F4C430]"
                style={{ fontFamily: 'Shrikhand, cursive', letterSpacing: '0.02em' }}
              >
                FESTIFY
              </h2>
              <p className="text-[11px] text-[#F7F2E7]/40 mt-1 font-bold uppercase tracking-wider">
                Thapar Institute · Patiala · 2026
              </p>
            </div>
          </div>

          {/* Center: Tagline */}
          <p className="max-w-xs text-[#F7F2E7]/60 text-sm font-fredoka leading-relaxed italic">
            "Where every moment becomes a postmark in time."
          </p>

          {/* Right: CTA + links */}
          <div className="flex flex-col gap-4 items-start md:items-end">
            <div className="flex gap-3">
              <button
                onClick={onOpenAdmin}
                className="px-5 py-2.5 bg-[#F06E38] text-[#1A1A1A] font-fredoka font-bold text-xs rounded-full border-2 border-[#F4C430] shadow-[2px_2px_0px_#F4C430] hover:-translate-y-0.5 transition-transform"
              >
                Admin Dashboard ➔
              </button>
              <button
                onClick={onOpenUserSide}
                className="px-5 py-2.5 bg-transparent text-[#F7F2E7] font-fredoka font-bold text-xs rounded-full border-2 border-[#F7F2E7]/30 hover:border-[#F4C430] hover:text-[#F4C430] transition-colors"
              >
                User Side
              </button>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {FOOTER_LINKS.map(l => (
                <a
                  key={l}
                  href="#"
                  className="text-xs font-bold uppercase tracking-widest text-[#F7F2E7]/30 hover:text-[#F4C430] transition-colors"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom rule + legal fine print */}
        <div className="mt-12 pt-6 border-t border-[#F7F2E7]/10">
          <p className="text-[10px] text-[#F7F2E7]/25 tracking-wider text-center leading-relaxed uppercase">
            © 2026 Festify Postal Services · Reg. No. UCS-503P-2026 · All rights reserved ·
            Delivery not guaranteed after registered deadline
          </p>
        </div>
      </div>
    </footer>
  );
}
