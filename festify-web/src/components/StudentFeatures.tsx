import { motion } from 'framer-motion';
import { STUDENT_FEATURES } from '../mockData';
import StampCard from './StampCard';

export default function StudentFeatures() {
  const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-3'];
  const badgeColors = ['bg-[#c23b32]', 'bg-[#2f7a82]', 'bg-[#e8a63b]', 'bg-[#d8722e]', 'bg-[#c23b32]'];

  return (
    <section id="students" className="relative bg-[#152b38] text-[#efe3c8] py-24 px-4 sm:px-6 border-b-4 border-[#efe3c8]">
      {/* Postal stripe accent top border */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-[repeating-linear-gradient(45deg,#c23b32,#c23b32_15px,#efe3c8_15px,#efe3c8_30px,#2f7a82_30px,#2f7a82_45px,#efe3c8_45px,#efe3c8_60px)]" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-typewriter text-xs font-bold tracking-widest uppercase text-[#e8a63b] bg-[#efe3c8]/10 px-4 py-1.5 border border-[#e8a63b]/30 rounded mb-4"
          >
            ✉ COLLECTION № 01 · FOR PARTICIPANTS & ATTENDEES
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-fraunces text-3xl sm:text-4xl md:text-5xl font-black text-[#efe3c8] max-w-2xl leading-tight mb-4"
          >
            The Ultimate Student Companion Pass
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-fraunces text-lg text-[#efe3c8]/80 max-w-xl"
          >
            Discover events, claim instant offline QR gate passes, view venue maps, and receive real-time updates.
          </motion.p>
        </div>

        {/* Features Stamp Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {STUDENT_FEATURES.map((feature, index) => (
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

        {/* Live offline PWA guarantee stamp */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-[#efe3c8] text-[#152b38] p-6 rounded border-2 border-[#efe3c8] shadow-[5px_5px_0px_#c23b32] flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#2f7a82] text-[#efe3c8] flex items-center justify-center font-alfa text-xl shrink-0 border border-[#152b38]">
              ⚡
            </div>
            <div>
              <h4 className="font-fraunces font-bold text-lg text-[#152b38]">
                Works 100% Offline via Progressive Web App
              </h4>
              <p className="font-fraunces text-sm text-[#152b38]/80">
                Network drops inside crowd zones? No problem. Your QR tickets and event schedules remain cached locally.
              </p>
            </div>
          </div>

          <a
            href="#organizers"
            className="px-6 py-3 bg-[#152b38] text-[#efe3c8] font-alfa text-sm rounded border border-[#152b38] shadow-[3px_3px_0px_#e8a63b] hover:bg-[#c23b32] transition-colors shrink-0"
          >
            TEST OFFLINE PASS ➔
          </a>
        </motion.div>

      </div>
    </section>
  );
}
