import { motion } from 'framer-motion';

interface StampCardProps {
  stampNo: string;
  denomination: string;
  tag: string;
  title: string;
  description: string;
  iconPath: string;
  rotation?: string; // e.g. 'rotate-1', '-rotate-2'
  badgeColor?: string;
  index?: number;
}

export default function StampCard({
  stampNo,
  denomination,
  tag,
  title,
  description,
  iconPath,
  rotation = 'rotate-0',
  badgeColor = 'bg-[#c23b32]',
  index = 0,
}: StampCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -6, scale: 1.02 }}
      className={`stamp-frame p-6 shadow-[5px_5px_0px_rgba(21,43,56,0.3)] transition-transform duration-200 ${rotation}`}
    >
      {/* Inner perforated / stamp container */}
      <div className="relative flex flex-col h-full bg-[#efe3c8] text-[#152b38] p-5 border border-[#152b38]/20 rounded-sm">
        {/* Top bar: Stamp number + Denomination */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-[#152b38]/30 pb-3 mb-4">
          <span className="font-typewriter text-xs font-bold tracking-widest text-[#152b38]/80">
            {stampNo}
          </span>
          <span className="font-alfa text-sm px-2 py-0.5 bg-[#152b38] text-[#efe3c8] rounded-sm shadow-sm">
            {denomination}
          </span>
        </div>

        {/* Icon & Tag */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2.5 rounded text-[#efe3c8] ${badgeColor} shadow-[2px_2px_0px_#152b38]`}>
            <svg
              className="w-6 h-6 stroke-current fill-none stroke-[2]"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={iconPath} />
            </svg>
          </div>
          <span className="font-typewriter text-[10px] font-bold tracking-widest uppercase px-2 py-1 bg-[#152b38]/10 text-[#152b38] border border-[#152b38]/20 rounded">
            {tag}
          </span>
        </div>

        {/* Content */}
        <h3 className="font-fraunces text-xl font-bold text-[#152b38] mb-2 leading-snug">
          {title}
        </h3>
        <p className="font-fraunces text-sm text-[#152b38]/80 leading-relaxed flex-grow">
          {description}
        </p>

        {/* Postmark decorative stamp mark bottom right */}
        <div className="mt-4 pt-3 border-t border-dashed border-[#152b38]/20 flex items-center justify-between text-[11px] font-typewriter text-[#152b38]/60">
          <span>POSTAGE PAID</span>
          <span className="font-bold">TIET · 2026</span>
        </div>
      </div>
    </motion.div>
  );
}
