import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EventDetailsModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onRegistered?: () => void;
}

export default function EventDetailsModal({ event, isOpen, onClose, onRegistered }: EventDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reset status message whenever the event changes — prevents success state
  // from leaking across different event modals.
  useEffect(() => {
    setStatusMsg(null);
  }, [event?.id]);

  if (!isOpen || !event) return null;

  const handleRegister = async () => {
    const token = localStorage.getItem('festify_token');
    if (!token) {
      setStatusMsg({ type: 'error', text: 'Please log in as a student to register for this event.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMsg({ type: 'error', text: data.error || 'Registration failed' });
      } else {
        setStatusMsg({
          type: 'success',
          text: 'Registration successful! Your QR pass is ready under "My Events".',
        });
        if (onRegistered) onRegistered();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const remaining = event.remainingSeats !== undefined ? event.remainingSeats : event.maxParticipants;
  const isFull = remaining <= 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-fredoka overflow-y-auto pt-20 pb-20">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#F7F2E7] border-2 border-[#1A1A1A] rounded-3xl overflow-hidden max-w-2xl w-full shadow-[8px_8px_0px_#1A1A1A] relative mt-auto mb-auto"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white border-2 border-[#1A1A1A] flex items-center justify-center font-bold text-xl hover:bg-[#EC6484] hover:text-white transition-colors z-10 shadow-sm"
          >
            ✕
          </button>

          {/* Banner Image */}
          <div className="w-full h-64 bg-gray-200 relative border-b-2 border-[#1A1A1A]">
            {event.image ? (
              <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-[#F4C430] opacity-80">
                <span className="text-4xl font-black font-groovy uppercase tracking-widest">{event.name.slice(0, 2)}</span>
              </div>
            )}
            <div className="absolute bottom-4 left-4 flex gap-2">
              <span className="px-3 py-1.5 bg-[#F4C430] text-[#1A1A1A] text-xs font-bold rounded-full border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
                {event.category}
              </span>
              <span className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] ${
                isFull ? 'bg-[#EF4444] text-white' : 'bg-[#10B981] text-white'
              }`}>
                {isFull ? 'FULL' : `${remaining} Seats Left`}
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-[#1A1A1A] uppercase tracking-tight leading-none mb-3">
                  {event.name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#1A1A1A]/70 uppercase tracking-widest">
                  <span>{event.date}</span>
                  <span>{event.startTime}</span>
                  <span>{event.venue}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 mb-6 border-l-4 border-[#EC6484] pl-4">
              <p className="text-[#1A1A1A] font-medium text-sm leading-relaxed">
                {event.description}
              </p>
            </div>

            {statusMsg && (
              <div className={`p-4 mb-6 rounded-xl border-2 border-[#1A1A1A] text-xs font-bold ${
                statusMsg.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
              }`}>
                {statusMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-[10px] font-black text-[#1A1A1A]/50 uppercase tracking-widest mb-2">Registration & Capacity</h4>
                <p className="text-xs font-bold text-[#1A1A1A] mb-1">Total Capacity: <span className="text-[#EC6484]">{event.maxParticipants}</span></p>
                <p className="text-xs font-bold text-[#1A1A1A] mb-1">Seats Remaining: <span className={remaining > 0 ? 'text-[#10B981]' : 'text-red-500'}>{remaining}</span></p>
                <p className="text-xs font-bold text-[#1A1A1A]">Deadline: {event.registrationDeadline}</p>
              </div>

              {event.prizes && (
                <div>
                  <h4 className="text-[10px] font-black text-[#1A1A1A]/50 uppercase tracking-widest mb-2">Prizes</h4>
                  <p className="text-sm font-bold text-[#F06E38]">{event.prizes}</p>
                </div>
              )}
            </div>

            {event.rules && (
              <div className="mb-8">
                <h4 className="text-[10px] font-black text-[#1A1A1A]/50 uppercase tracking-widest mb-2">Rules & Guidelines</h4>
                <div className="bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl p-4 text-xs font-medium text-[#1A1A1A]/80 whitespace-pre-line">
                  {event.rules}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t-2 border-[#1A1A1A]/10 mt-auto">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60">
                Contact: <br/><span className="text-[#1A1A1A]">{event.contact || 'N/A'}</span>
              </p>
              
              {isFull || event.status === 'Registration Closed' ? (
                <button disabled className="px-8 py-3 bg-[#1A1A1A]/20 text-[#1A1A1A]/50 font-black text-sm rounded-xl border-2 border-[#1A1A1A]/20 uppercase tracking-wider cursor-not-allowed">
                  {isFull ? 'Event Full' : 'Registrations Closed'}
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="px-8 py-3 bg-[#EC6484] text-[#1A1A1A] font-black text-sm rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] hover:bg-[#F06E38] hover:text-white transition-colors uppercase tracking-wider disabled:opacity-60"
                >
                  {loading ? 'Registering...' : 'Register Now'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
