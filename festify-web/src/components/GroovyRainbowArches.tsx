import { motion } from 'framer-motion';

interface RainbowProps {
  isAnimatingIn?: boolean;
}

/*
  Each arch is ONE motion.g scaled from its corner anchor. Individual bands only
  stagger their opacity so they peel out from outermost to innermost, while position
  and scale stay locked to the parent group — preventing browser-specific SVG
  transform-origin glitches that occur when animating individual paths.
*/

const GROUP_SPRING = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 20,
};

const bandVariants = (delay: number) => ({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18, delay } },
});

// Left arch — grows from bottom-left corner
export function LeftRainbowArch({ isAnimatingIn = true }: RainbowProps) {
  return (
    <div
      className="absolute left-0 bottom-0 w-36 sm:w-52 md:w-72 lg:w-80 pointer-events-none z-0"
      style={{ height: 480 }}
    >
      <svg
        viewBox="0 0 280 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
        style={{ display: 'block' }}
      >
        <motion.g
          style={{ transformOrigin: '0px 480px' }}
          initial={{ scale: 0 }}
          animate={isAnimatingIn ? { scale: 1 } : { scale: 0 }}
          transition={{ ...GROUP_SPRING, delay: 0.05 }}
        >
          <motion.path
            d="M0 40 C 140 40, 220 140, 220 280 L 220 480 L 175 480 L 175 280 C 175 165, 120 85, 0 85 Z"
            fill="#EC6484" stroke="#1A1A1A" strokeWidth="8" strokeLinejoin="round"
            variants={bandVariants(0)}
            initial="hidden" animate={isAnimatingIn ? 'visible' : 'hidden'}
          />
          <motion.path
            d="M0 85 C 120 85, 175 165, 175 280 L 175 480 L 130 480 L 130 280 C 130 190, 90 130, 0 130 Z"
            fill="#F4C430" stroke="#1A1A1A" strokeWidth="8" strokeLinejoin="round"
            variants={bandVariants(0.06)}
            initial="hidden" animate={isAnimatingIn ? 'visible' : 'hidden'}
          />
          <motion.path
            d="M0 130 C 90 130, 130 190, 130 280 L 130 480 L 85 480 L 85 280 C 85 215, 60 175, 0 175 Z"
            fill="#F06E38" stroke="#1A1A1A" strokeWidth="8" strokeLinejoin="round"
            variants={bandVariants(0.12)}
            initial="hidden" animate={isAnimatingIn ? 'visible' : 'hidden'}
          />
          <motion.path
            d="M0 175 C 60 175, 85 215, 85 280 L 85 480 L 40 480 L 40 280 C 40 240, 30 220, 0 220 Z"
            fill="#D94E28" stroke="#1A1A1A" strokeWidth="8" strokeLinejoin="round"
            variants={bandVariants(0.18)}
            initial="hidden" animate={isAnimatingIn ? 'visible' : 'hidden'}
          />
        </motion.g>
      </svg>
    </div>
  );
}

// Right arch — grows from top-right corner
export function RightRainbowArch({ isAnimatingIn = true }: RainbowProps) {
  return (
    <div
      className="absolute right-0 top-0 w-36 sm:w-52 md:w-72 lg:w-80 pointer-events-none z-0"
      style={{ height: 480 }}
    >
      <svg
        viewBox="0 0 280 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
        style={{ display: 'block' }}
      >
        <motion.g
          style={{ transformOrigin: '280px 0px' }}
          initial={{ scale: 0 }}
          animate={isAnimatingIn ? { scale: 1 } : { scale: 0 }}
          transition={{ ...GROUP_SPRING, delay: 0.1 }}
        >
          <motion.path
            d="M280 440 C 140 440, 60 340, 60 200 L 60 0 L 105 0 L 105 200 C 105 315, 160 395, 280 395 Z"
            fill="#EC6484" stroke="#1A1A1A" strokeWidth="8" strokeLinejoin="round"
            variants={bandVariants(0)}
            initial="hidden" animate={isAnimatingIn ? 'visible' : 'hidden'}
          />
          <motion.path
            d="M280 395 C 160 395, 105 315, 105 200 L 105 0 L 150 0 L 150 200 C 150 290, 190 350, 280 350 Z"
            fill="#F4C430" stroke="#1A1A1A" strokeWidth="8" strokeLinejoin="round"
            variants={bandVariants(0.06)}
            initial="hidden" animate={isAnimatingIn ? 'visible' : 'hidden'}
          />
          <motion.path
            d="M280 350 C 190 350, 150 290, 150 200 L 150 0 L 195 0 L 195 200 C 195 265, 220 305, 280 305 Z"
            fill="#F06E38" stroke="#1A1A1A" strokeWidth="8" strokeLinejoin="round"
            variants={bandVariants(0.12)}
            initial="hidden" animate={isAnimatingIn ? 'visible' : 'hidden'}
          />
          <motion.path
            d="M280 305 C 220 305, 195 265, 195 200 L 195 0 L 240 0 L 240 200 C 240 240, 250 260, 280 260 Z"
            fill="#D94E28" stroke="#1A1A1A" strokeWidth="8" strokeLinejoin="round"
            variants={bandVariants(0.18)}
            initial="hidden" animate={isAnimatingIn ? 'visible' : 'hidden'}
          />
        </motion.g>
      </svg>
    </div>
  );
}

// Static version (no Framer Motion) used inside non-hero sections
export function StaticLeftStripes({ height = 480 }: { height?: number }) {
  return (
    <div className="absolute left-0 top-0 w-24 sm:w-32 pointer-events-none z-0" style={{ height }}>
      <svg viewBox="0 0 160 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="0"   width="40" height="480" fill="#EC6484" />
        <rect x="40"  width="40" height="480" fill="#F4C430" />
        <rect x="80"  width="40" height="480" fill="#F06E38" />
        <rect x="120" width="40" height="480" fill="#D94E28" />
      </svg>
    </div>
  );
}

export function StaticRightStripes({ height = 480 }: { height?: number }) {
  return (
    <div className="absolute right-0 top-0 w-24 sm:w-32 pointer-events-none z-0" style={{ height }}>
      <svg viewBox="0 0 160 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="120" width="40" height="480" fill="#EC6484" />
        <rect x="80"  width="40" height="480" fill="#F4C430" />
        <rect x="40"  width="40" height="480" fill="#F06E38" />
        <rect x="0"   width="40" height="480" fill="#D94E28" />
      </svg>
    </div>
  );
}
