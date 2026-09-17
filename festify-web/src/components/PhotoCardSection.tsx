import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StaticLeftStripes, StaticRightStripes } from './GroovyRainbowArches';

// Unsplash concert / fest photos (landscape & portrait both work)
const PHOTOS = [
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=600&q=80',
];

const CARD_TILTS = [-3, 2, -1.5, 3, -2.5];

export default function PhotoCardSection() {
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(1);

  const shuffle = () => {
    setDirection(1);
    setIdx(prev => (prev + 1) % PHOTOS.length);
  };

  return (
    <section className="relative bg-[#F7F2E7] overflow-hidden py-20 border-b-2 border-[#1A1A1A]">
      {/* Vertical rainbow stripe bands behind card */}
      <StaticLeftStripes height={580} />
      <StaticRightStripes height={580} />

      {/* Section label */}
      <div className="relative z-10 text-center mb-10">
        <span className="inline-block px-4 py-1.5 bg-[#1A1A1A] text-[#F7F2E7] font-fredoka font-bold text-xs uppercase tracking-widest rounded-full">
          🎉 Fest Moments
        </span>
      </div>

      {/* Card + shuffle */}
      <div className="relative z-10 flex flex-col items-center gap-0">
        {/* Photo card */}
        <div className="relative" style={{ width: 320, height: 420 }}>
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={idx}
              custom={direction}
              initial={{ opacity: 0, x: direction * 80, rotate: direction * 6, scale: 0.92 }}
              animate={{
                opacity: 1,
                x: 0,
                rotate: CARD_TILTS[idx],
                scale: 1,
              }}
              exit={{ opacity: 0, x: -direction * 80, rotate: -direction * 4, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] bg-[#EFE8D8]"
            >
              <img
                src={PHOTOS[idx]}
                alt={`Fest moment ${idx + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
              {/* Subtle dark overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
              {/* Corner sticker label */}
              <div className="absolute top-3 left-3 bg-[#F4C430] text-[#1A1A1A] text-[10px] font-bold px-2 py-1 rounded-full border border-[#1A1A1A] uppercase tracking-wider">
                Aurora Fest 2026
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Shuffle pill button — overlaps bottom of card */}
        <motion.button
          onClick={shuffle}
          whileTap={{ scale: 0.94 }}
          whileHover={{ y: -2, boxShadow: '4px 5px 0px #1A1A1A' }}
          className="relative z-20 -mt-5 flex items-center gap-2 bg-[#F7F2E7] text-[#1A1A1A] font-fredoka font-bold text-sm px-6 py-2.5 rounded-full border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] transition-shadow"
        >
          {/* Refresh icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Shuffle
        </motion.button>

        {/* Dot indicators */}
        <div className="flex gap-2 mt-5">
          {PHOTOS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > idx ? 1 : -1); setIdx(i); }}
              className={`w-2 h-2 rounded-full border border-[#1A1A1A] transition-all ${
                i === idx ? 'bg-[#F06E38] scale-125' : 'bg-[#1A1A1A]/20'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
