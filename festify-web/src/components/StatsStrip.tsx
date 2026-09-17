import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { STATS } from '../mockData';
import type { StatStrip } from '../types';

/* ─────────────────────────────────────────────────────────────────
   StatsStrip — burnt-orange section with 3 dashed-circle counters

   🎓 TEACHING NOTE: requestAnimationFrame for count-up animation
   We already covered this in the first version. Here, each counter is
   styled as a "rubber stamp impression" — a dashed circular border,
   slightly tilted, with the number in Alfa Slab One.
   The tilt angles below are INTENTIONALLY inconsistent (like real
   hand-stamped impressions that are never perfectly aligned).
───────────────────────────────────────────────────────────────── */

const TILTS = [-4, 2, -2.5]; // degrees of rotation per stat

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

function Counter({ stat, index }: { stat: StatStrip; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    if (!inView) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      if (numRef.current) numRef.current.textContent = stat.value.toLocaleString('en-IN') + stat.suffix;
      return;
    }
    const startTime = performance.now();
    let frameId: number;
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / stat.duration, 1);
      const val = Math.round(easeOutQuart(progress) * stat.value);
      if (numRef.current) numRef.current.textContent = val.toLocaleString('en-IN') + stat.suffix;
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [inView, stat.value, stat.duration, stat.suffix]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.6 }}
      className="flex flex-col items-center"
    >
      {/* Dashed circle rubber-stamp impression */}
      <div
        style={{ transform: `rotate(${TILTS[index]}deg)` }}
        className="flex flex-col items-center justify-center"
      >
        <div
          className="relative flex flex-col items-center justify-center"
          style={{
            width: 200,
            height: 200,
            border: '3px dashed #152b38',
            borderRadius: '50%',
            padding: 20,
            boxShadow: 'inset 0 0 0 8px rgba(21,43,56,0.08)',
          }}
        >
          {/* Inner ring */}
          <div
            style={{
              position: 'absolute',
              inset: 12,
              border: '1.5px solid rgba(21,43,56,0.35)',
              borderRadius: '50%',
            }}
          />
          {/* Big number */}
          <span
            ref={numRef}
            className="font-display text-navy leading-none"
            style={{ fontSize: '3.5rem' }}
          >
            0
          </span>
          {/* Label */}
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-navy/70 mt-1">
            {stat.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function StatsStrip() {
  return (
    <section id="stats" style={{ backgroundColor: '#d8722e' }} className="py-24 px-6">
      {/* Top border line */}
      <div className="border-t-2 border-navy/30 max-w-5xl mx-auto mb-16" />

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-navy/60 mb-3">
            — The Numbers —
          </p>
          <h2 className="font-heading font-black text-4xl md:text-5xl text-navy">
            By The Postmark
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 place-items-center">
          {STATS.map((stat, i) => (
            <Counter key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </div>

      <div className="border-b-2 border-navy/30 max-w-5xl mx-auto mt-16" />
    </section>
  );
}
