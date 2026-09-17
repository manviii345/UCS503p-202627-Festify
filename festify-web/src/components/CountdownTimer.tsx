import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeRemaining(targetDate: Date): CountdownTime {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const diff = Math.max(0, target - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, '0');

  return (
    <motion.div
      className="flex flex-col items-center"
      whileHover={{ scale: 1.05 }}
    >
      <div className="
        relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24
        flex items-center justify-center
        bg-[#efe3c8] text-[#152b38]
        border-2 border-[#152b38] rounded-md
        shadow-[3px_3px_0px_#152b38]
      ">
        {/* Stamp perforation accent border */}
        <div className="absolute inset-1 border border-dashed border-[#152b38]/40 pointer-events-none" />

        <motion.span
          key={display}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="font-alfa text-2xl sm:text-3xl md:text-4xl text-[#152b38] relative z-10"
        >
          {display}
        </motion.span>
      </div>

      <span className="mt-2 font-typewriter text-[10px] sm:text-xs tracking-widest uppercase text-[#152b38]/80 font-bold">
        {label}
      </span>
    </motion.div>
  );
}

export default function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [time, setTime] = useState<CountdownTime>(() => getTimeRemaining(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const hasStarted = new Date() >= targetDate;

  if (hasStarted) {
    return (
      <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#c23b32] text-[#efe3c8] border-2 border-[#152b38] shadow-[3px_3px_0px_#152b38] font-alfa text-lg rounded">
        <span>★</span> FEST IS LIVE NOW <span>★</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="font-typewriter text-xs text-[#152b38]/70 tracking-widest uppercase bg-[#efe3c8]/80 px-3 py-1 border border-[#152b38]/30 rounded">
          ⏱ DISPATCH COUNTDOWN · SEP 20, 2026
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        <TimeUnit value={time.days} label="Days" />
        <Colon />
        <TimeUnit value={time.hours} label="Hours" />
        <Colon />
        <TimeUnit value={time.minutes} label="Mins" />
        <Colon />
        <TimeUnit value={time.seconds} label="Secs" />
      </div>
    </div>
  );
}

function Colon() {
  return (
    <span className="font-alfa text-2xl sm:text-3xl text-[#152b38] pb-6 opacity-60">
      :
    </span>
  );
}
