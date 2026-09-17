import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { LeftRainbowArch, RightRainbowArch } from './GroovyRainbowArches';

interface HeroProps {
  onOpenAdmin: () => void;
  onOpenUserSide: () => void;
}

/* ─────────────────────────────────────────────────────────────
   Animation stages
   0 = mascot + typewriter only (intro)
   1 = arches animate in
   2 = nav + headline + CTA revealed (page revealed)
───────────────────────────────────────────────────────────── */
const PHRASES = ["Hey!", "Festify's live...", "Your stop for an amazing event"];

// Consistent spring for bouncy feel
const spring = (delay = 0) => ({
  type: 'spring' as const,
  stiffness: 260,
  damping: 18,
  delay,
});

// Letter-level stagger config
const letterVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.5, rotate: -10 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1, rotate: 0,
    transition: spring(i * 0.055),
  }),
};

const LETTERS = ['F', 'E', 'S', 'T', 'I', 'F', 'Y'];
// Alternate letter accent colors
const LETTER_COLORS = ['#EC6484', '#F06E38', '#F4C430', '#D94E28', '#EC6484', '#F06E38', '#F4C430'];

export default function Hero({ onOpenAdmin, onOpenUserSide }: HeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const [stage, setStage] = useState(0);           // 0→1→2
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Skip all animation if user prefers reduced motion
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayText(PHRASES[PHRASES.length - 1]);
      setTypingDone(true);
      setStage(2);
    }
  }, [prefersReducedMotion]);

  // ── Typewriter effect ──
  useEffect(() => {
    if (prefersReducedMotion || typingDone) return;

    const currentPhrase = PHRASES[phraseIdx];

    if (displayText.length < currentPhrase.length) {
      // Type next character
      intervalRef.current = setTimeout(() => {
        setDisplayText(currentPhrase.slice(0, displayText.length + 1));
      }, phraseIdx === PHRASES.length - 1 ? 38 : 50); // faster on final phrase
    } else {
      if (phraseIdx < PHRASES.length - 1) {
        // Pause, clear, move to next phrase; trigger arches at phrase 2
        intervalRef.current = setTimeout(() => {
          if (phraseIdx === 1) setStage(1);      // arches start growing
          setDisplayText('');
          setPhraseIdx(p => p + 1);
        }, phraseIdx === 0 ? 400 : 350);
      } else {
        // Final phrase finished → reveal page
        intervalRef.current = setTimeout(() => {
          setTypingDone(true);
          setStage(2);
        }, 250);
      }
    }

    return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
  }, [displayText, phraseIdx, typingDone, prefersReducedMotion]);

  const archesIn = stage >= 1;
  const pageIn   = stage >= 2;

  return (
    <div className="relative min-h-screen bg-[#F7F2E7] text-[#1A1A1A] flex flex-col overflow-hidden font-fredoka">

      {/* ══ Rainbow Arch Graphics ══ */}
      <LeftRainbowArch isAnimatingIn={archesIn} />
      <RightRainbowArch isAnimatingIn={archesIn} />

      {/* ══ NAV BAR ══ */}
      <motion.nav
        initial={{ y: -72, opacity: 0 }}
        animate={pageIn ? { y: 0, opacity: 1 } : { y: -72, opacity: 0 }}
        transition={spring(0)}
        className="relative z-20 w-full px-6 sm:px-10 py-5 flex items-center justify-between border-b-2 border-[#1A1A1A]/10"
      >
        <span className="groovy-logo-small text-2xl sm:text-3xl font-black">FESTIFY</span>

        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-[#1A1A1A]">
          {['About Us', 'Website Gallery', 'FAQs'].map((label, i) => (
            <motion.a
              key={label}
              href="#"
              initial={{ opacity: 0, y: -10 }}
              animate={pageIn ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
              transition={spring(0.05 + i * 0.06)}
              className="hover:text-[#F06E38] transition-colors"
            >
              {label}
            </motion.a>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={pageIn ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={spring(0.15)}
          onClick={onOpenUserSide}
          className="btn-groovy-pink px-5 py-2 text-xs sm:text-sm uppercase tracking-wider"
        >
          Contact Us
        </motion.button>
      </motion.nav>

      {/* ══ MAIN HERO BODY ══ */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-12 pt-4 text-center">

        {/* ── MASCOT + SPEECH BUBBLE ─────────────────────────
            Starts centered (large), morphs to small caption
            above the headline once the page reveals
        ───────────────────────────────────────────────────── */}
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className={`flex items-center gap-3 sm:gap-4 z-30 ${
            pageIn
              ? 'mb-6 self-center'
              : 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
          }`}
        >
          {/* Circular Badge Mascot */}
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            whileHover={{ rotate: 15, scale: 1.1 }}
            style={{
              width:  pageIn ? '2.75rem' : '4rem',
              height: pageIn ? '2.75rem' : '4rem',
            }}
            className="rounded-full bg-[#EC6484] border-[3px] border-dashed border-[#1A1A1A] flex items-center justify-center text-[#F4C430] shadow-[3px_3px_0px_#1A1A1A] shrink-0 select-none cursor-pointer transition-all"
            onClick={() => setStage(2)}         // skip to end on click
          >
            <span className="font-groovy" style={{ fontSize: pageIn ? '1.1rem' : '1.6rem' }}>✉</span>
          </motion.div>

          {/* Speech Bubble */}
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative speech-bubble bg-[#F7F2E7] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] rounded-2xl flex items-center"
            style={{
              padding: pageIn ? '0.35rem 0.85rem' : '0.6rem 1.1rem',
              minWidth: pageIn ? '8rem' : '14rem',
            }}
          >
            <span
              className="font-bold text-[#1A1A1A] leading-snug whitespace-nowrap"
              style={{ fontSize: pageIn ? '0.7rem' : '1rem' }}
            >
              {displayText}
            </span>
            {/* Blinking cursor */}
            {!typingDone && (
              <span className="typewriter-cursor" />
            )}
          </motion.div>
        </motion.div>

        {/* ── FESTIFY STAGGERED LETTERS ──────────────────── */}
        <AnimatePresence>
          {pageIn && (
            <motion.div
              className="flex flex-wrap justify-center items-center gap-0 sm:gap-1 mb-4 select-none"
              initial="hidden"
              animate="visible"
            >
              {LETTERS.map((char, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={letterVariants}
                  whileHover={{ scale: 1.15, rotate: i % 2 === 0 ? -5 : 5, y: -6 }}
                  className="groovy-letter cursor-pointer"
                  style={{
                    fontSize: 'clamp(3.5rem, 12vw, 8rem)',
                    color: LETTER_COLORS[i],
                    WebkitTextStroke: '3px #1A1A1A',
                    textShadow: '4px 4px 0px #1A1A1A',
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SUBHEADING ───────────────────────────────── */}
        <AnimatePresence>
          {pageIn && (
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={spring(0.42)}
              className="text-base sm:text-xl md:text-2xl font-bold text-[#1A1A1A] max-w-xl mb-10 leading-relaxed"
            >
              Streamline college fest registrations, offline QR gate passes,<br className="hidden sm:block" /> live schedules & organizer dashboards.
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── CTA BUTTONS ──────────────────────────────── */}
        <AnimatePresence>
          {pageIn && (
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={spring(0.54)}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-lg"
            >
              <button
                onClick={onOpenAdmin}
                className="btn-groovy-orange w-full sm:w-auto px-8 py-4 text-base sm:text-lg flex items-center justify-center gap-2 group"
              >
                <span>Try our Admin Dashboard</span>
                <span className="group-hover:translate-x-1 transition-transform">➔</span>
              </button>

              <button
                onClick={onOpenUserSide}
                className="btn-groovy-yellow w-full sm:w-auto px-8 py-4 text-base sm:text-lg flex items-center justify-center gap-2 group"
              >
                <span>Try out user side</span>
                <span className="group-hover:translate-x-1 transition-transform">➔</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip hint (only during intro stage 0) */}
        <AnimatePresence>
          {!pageIn && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              onClick={() => { setTypingDone(true); setStage(2); setDisplayText(PHRASES[PHRASES.length - 1]); }}
              className="fixed bottom-8 right-8 text-xs text-[#1A1A1A]/50 font-bold uppercase tracking-widest hover:text-[#1A1A1A] transition-colors z-50"
            >
              Skip intro ➔
            </motion.button>
          )}
        </AnimatePresence>
      </main>

      {/* ══ Bottom footer rule ══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={pageIn ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="relative z-10 w-full border-t-2 border-[#1A1A1A]/10 py-3 text-center text-[10px] sm:text-xs font-bold text-[#1A1A1A]/40 tracking-widest uppercase"
      >
        Festify Official Event Management Platform · 2026 Edition
      </motion.div>
    </div>
  );
}
