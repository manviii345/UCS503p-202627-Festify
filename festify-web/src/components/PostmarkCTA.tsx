import { motion } from 'framer-motion';

export default function PostmarkCTA() {
  return (
    <section className="relative bg-[#c23b32] text-[#efe3c8] py-24 px-4 sm:px-6 border-b-4 border-[#152b38] overflow-hidden">
      {/* Background postal lines & watermark */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#efe3c8_2px,transparent_2px)] [background-size:24px_24px]" />

      {/* Big Stamp Circle Watermark */}
      <motion.div
        initial={{ opacity: 0, scale: 1.5, rotate: -30 }}
        whileInView={{ opacity: 0.15, scale: 1, rotate: -12 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'backOut' }}
        className="absolute -right-12 -bottom-12 w-96 h-96 rounded-full border-8 border-dashed border-[#efe3c8] pointer-events-none flex items-center justify-center text-center p-6"
      >
        <div className="font-alfa text-4xl text-[#efe3c8] tracking-widest uppercase">
          APPROVED DISPATCH
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
        
        {/* Postmark rubber stamp badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
          whileInView={{ opacity: 1, scale: 1, rotate: -4 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 300, damping: 15 }}
          className="inline-flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#efe3c8] rounded bg-[#152b38]/30 mb-8"
        >
          <span className="font-typewriter text-xs font-bold tracking-widest uppercase text-[#e8a63b]">
            ★ EXPRESS POSTAL REGISTRATION ★
          </span>
          <span className="font-alfa text-sm text-[#efe3c8] mt-0.5">
            PATIALA POST OFFICE · 2026
          </span>
        </motion.div>

        {/* Big Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-alfa text-3xl sm:text-5xl md:text-6xl text-[#efe3c8] leading-tight mb-6 drop-shadow-[3px_3px_0px_#152b38]"
        >
          READY TO STAMP YOUR FESTIVAL ON THE MAP?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-fraunces text-lg sm:text-xl text-[#efe3c8]/90 max-w-2xl mb-10 leading-relaxed font-medium"
        >
          Join 50+ college festivals using Festify to manage registrations, entry gates, schedules, and live crowd analytics.
        </motion.p>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <a
            href="#organizers"
            className="px-10 py-5 bg-[#efe3c8] text-[#152b38] font-alfa text-xl rounded-sm border-2 border-[#152b38] shadow-[5px_5px_0px_#152b38] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_#152b38] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all flex items-center gap-3 group"
          >
            <span>GET STARTED FOR FREE</span>
            <span className="group-hover:translate-x-1 transition-transform">➔</span>
          </a>
        </motion.div>

        {/* Typewriter fine print */}
        <div className="mt-8 font-typewriter text-xs text-[#efe3c8]/70 tracking-widest uppercase">
          NO CREDIT CARD REQUIRED · INSTANT PWA SETUP · OFFLINE READY
        </div>

      </div>
    </section>
  );
}
