import { motion } from 'framer-motion';
import { ORGANIZER_FEATURES } from '../mockData';
import StampCard from './StampCard';

export default function OrganizerFeatures() {
  const rotations = ['rotate-2', '-rotate-2', 'rotate-1', '-rotate-3', 'rotate-3', '-rotate-1'];
  const badgeColors = ['bg-[#152b38]', 'bg-[#c23b32]', 'bg-[#2f7a82]', 'bg-[#d8722e]', 'bg-[#152b38]', 'bg-[#c23b32]'];

  return (
    <section id="organizers" className="relative bg-[#e8a63b] text-[#152b38] py-24 px-4 sm:px-6 border-b-4 border-[#152b38]">
      {/* Background paper texture watermark lines */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#152b38_1.5px,transparent_1.5px)] [background-size:20px_20px]" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-typewriter text-xs font-bold tracking-widest uppercase text-[#efe3c8] bg-[#152b38] px-4 py-1.5 rounded shadow-[3px_3px_0px_#c23b32] mb-4"
          >
            ✉ COLLECTION № 02 · FOR FESTIVAL ORGANIZERS & CLUBS
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-fraunces text-3xl sm:text-4xl md:text-5xl font-black text-[#152b38] max-w-2xl leading-tight mb-4"
          >
            Built for High-Volume College Festival Operations
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-fraunces text-lg text-[#152b38]/90 max-w-xl font-medium"
          >
            Manage multi-track schedules, fast sub-second QR entry check-ins, volunteers, and instant lock-screen notifications.
          </motion.p>
        </div>

        {/* Organizer Stamp Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ORGANIZER_FEATURES.map((feature, index) => (
            <StampCard
              key={feature.id}
              stampNo={feature.stampNo}
              denomination={feature.denomination}
              tag={feature.tag}
              title={feature.title}
              description={feature.description}
              iconPath={feature.iconPath}
              rotation={rotations[index % rotations.length]}
              badgeColor={badgeColors[index % badgeColors.length]}
              index={index}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
