import { useState } from 'react';
import { motion } from 'framer-motion';
import { DASHBOARD_STATS } from '../mockData';

export default function DashboardPreview() {
  const [liveCount, setLiveCount] = useState(1039);
  const [lastCheckIn, setLastCheckIn] = useState('Gate A · 2s ago');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const handleSimulateCheckIn = () => {
    setLiveCount(prev => prev + 1);
    const gates = ['Gate A · Main Audi', 'Gate B · Amphitheatre', 'Gate C · Tech Park'];
    const randomGate = gates[Math.floor(Math.random() * gates.length)];
    setLastCheckIn(`${randomGate} · just now`);
  };

  const handleBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  return (
    <section className="relative bg-[#2f7a82] text-[#efe3c8] py-24 px-4 sm:px-6 border-b-4 border-[#152b38]">
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Title */}
        <div className="flex flex-col items-center text-center mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-typewriter text-xs font-bold tracking-widest uppercase text-[#152b38] bg-[#efe3c8] px-4 py-1.5 rounded shadow-[3px_3px_0px_#152b38] mb-4"
          >
            📊 COMMAND CENTER PREVIEW
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-fraunces text-3xl sm:text-4xl md:text-5xl font-black text-[#efe3c8] max-w-2xl leading-tight mb-4"
          >
            Real-Time Fest Analytics & Gate Dispatch
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-fraunces text-lg text-[#efe3c8]/90 max-w-xl"
          >
            Monitor venue attendance, track gate throughput, and dispatch broadcasts live from any device.
          </motion.p>
        </div>

        {/* Giant Stamp Framed Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="stamp-frame p-6 sm:p-8 bg-[#efe3c8] text-[#152b38] rounded shadow-[8px_8px_0px_#152b38] relative overflow-hidden"
        >
          {/* Top Stamp Header bar */}
          <div className="flex flex-wrap items-center justify-between border-b-2 border-dashed border-[#152b38]/30 pb-4 mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#c23b32] animate-pulse" />
              <span className="font-alfa text-xl text-[#152b38] tracking-wide">
                FESTIFY ORGANIZER HUB v2.6
              </span>
              <span className="font-typewriter text-xs bg-[#152b38] text-[#efe3c8] px-2 py-0.5 rounded">
                LIVE SESSION
              </span>
            </div>

            <div className="font-typewriter text-xs text-[#152b38]/70 font-bold">
              REF № 9048-PATIALA-HQ
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Metric 1 */}
            <div className="bg-[#efe3c8] p-5 rounded border-2 border-[#152b38] shadow-[3px_3px_0px_#152b38]">
              <div className="flex items-center justify-between text-xs font-typewriter font-bold text-[#152b38]/70 mb-2">
                <span>TOTAL REGISTRATIONS</span>
                <span className="text-[#c23b32]">100% CAP</span>
              </div>
              <div className="font-alfa text-3xl text-[#152b38]">
                {DASHBOARD_STATS[0].value}
              </div>
              <div className="font-fraunces text-xs text-[#152b38]/80 mt-1 font-semibold">
                {DASHBOARD_STATS[0].subtext}
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-[#efe3c8] p-5 rounded border-2 border-[#152b38] shadow-[3px_3px_0px_#152b38] relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-typewriter font-bold text-[#152b38]/70 mb-2">
                <span>LIVE GATE CHECK-INS</span>
                <span className="text-[#2f7a82] font-bold">● ACTIVE</span>
              </div>
              <div className="font-alfa text-3xl text-[#152b38]">
                {liveCount.toLocaleString()}
              </div>
              <div className="font-fraunces text-xs text-[#152b38]/80 mt-1 font-semibold flex items-center justify-between">
                <span>{lastCheckIn}</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-[#efe3c8] p-5 rounded border-2 border-[#152b38] shadow-[3px_3px_0px_#152b38]">
              <div className="flex items-center justify-between text-xs font-typewriter font-bold text-[#152b38]/70 mb-2">
                <span>ACTIVE EVENTS</span>
                <span className="text-[#e8a63b]">STAGE 1 & 2</span>
              </div>
              <div className="font-alfa text-3xl text-[#152b38]">
                {DASHBOARD_STATS[2].value}
              </div>
              <div className="font-fraunces text-xs text-[#152b38]/80 mt-1 font-semibold">
                {DASHBOARD_STATS[2].subtext}
              </div>
            </div>
          </div>

          {/* Interactive Simulation Panel */}
          <div className="bg-[#152b38] text-[#efe3c8] p-5 rounded border-2 border-[#152b38] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-alfa text-xl text-[#e8a63b]">⚡</span>
              <div>
                <div className="font-fraunces font-bold text-sm text-[#efe3c8]">
                  Interactive Dispatch Simulator
                </div>
                <div className="font-typewriter text-xs text-[#efe3c8]/70">
                  Simulate QR scanner scan or emergency announcement dispatch
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleSimulateCheckIn}
                className="flex-1 sm:flex-none px-4 py-2 bg-[#2f7a82] text-[#efe3c8] font-alfa text-xs rounded border border-[#efe3c8]/30 shadow-[2px_2px_0px_#c23b32] hover:bg-[#efe3c8] hover:text-[#152b38] transition-all"
              >
                + SIMULATE SCAN
              </button>

              <button
                onClick={handleBroadcast}
                className="flex-1 sm:flex-none px-4 py-2 bg-[#c23b32] text-[#efe3c8] font-alfa text-xs rounded border border-[#efe3c8]/30 shadow-[2px_2px_0px_#e8a63b] hover:bg-[#e8a63b] hover:text-[#152b38] transition-all"
              >
                {broadcastSent ? 'BROADCAST SENT! ✓' : 'PUSH ALERT BROADCAST'}
              </button>
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  );
}
