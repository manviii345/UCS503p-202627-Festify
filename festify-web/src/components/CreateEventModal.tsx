import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateEventModal({ isOpen, onClose, onSuccess }: CreateEventModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    category: 'Technical',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    maxParticipants: '',
    registrationDeadline: '',
    rules: '',
    prizes: '',
    contact: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('festify_token');

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert('Failed to create event');
      }
    } catch (error) {
      console.error(error);
      alert('Error creating event');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-fredoka overflow-y-auto pt-20 pb-20">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#F7F2E7] border-2 border-[#1A1A1A] rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-[6px_6px_0px_#1A1A1A] relative mt-auto mb-auto"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center font-bold hover:bg-[#EC6484] hover:text-white transition-colors"
        >
          ✕
        </button>

        <h3 className="text-2xl font-black text-[#1A1A1A] mb-6">+ Create New Event</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Event Name *</label>
              <input required name="name" value={formData.name} onChange={handleChange} type="text" placeholder="e.g. Hacklipse 2026" className="w-full p-2.5 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Category *</label>
              <select required name="category" value={formData.category} onChange={handleChange} className="w-full p-2.5 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]">
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Gaming">Gaming</option>
                <option value="Workshop">Workshop</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Description *</label>
            <textarea required name="description" value={formData.description} onChange={handleChange} rows={2} className="w-full p-2.5 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]" placeholder="Detailed description of the event..."></textarea>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Poster/Image URL</label>
            <input name="image" value={formData.image} onChange={handleChange} type="url" placeholder="https://..." className="w-full p-2.5 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Date *</label>
              <input required name="date" value={formData.date} onChange={handleChange} type="date" className="w-full p-2.5 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Start Time *</label>
              <input required name="startTime" value={formData.startTime} onChange={handleChange} type="time" className="w-full p-2.5 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">End Time *</label>
              <input required name="endTime" value={formData.endTime} onChange={handleChange} type="time" className="w-full p-2.5 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Venue *</label>
              <input required name="venue" value={formData.venue} onChange={handleChange} type="text" placeholder="Main Auditorium" className="w-full p-2.5 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Max Participants *</label>
              <input required name="maxParticipants" value={formData.maxParticipants} onChange={handleChange} type="number" min="1" className="w-full p-2.5 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Reg. Deadline *</label>
              <input required name="registrationDeadline" value={formData.registrationDeadline} onChange={handleChange} type="date" className="w-full p-2.5 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Prizes</label>
              <input name="prizes" value={formData.prizes} onChange={handleChange} type="text" placeholder="1st: $500, 2nd: $200" className="w-full p-2.5 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Contact Info</label>
              <input name="contact" value={formData.contact} onChange={handleChange} type="text" placeholder="John: +1234567890" className="w-full p-2.5 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Rules</label>
            <textarea name="rules" value={formData.rules} onChange={handleChange} rows={2} className="w-full p-2.5 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]" placeholder="1. Must be a student..."></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-xs font-bold border-2 border-[#1A1A1A] rounded-xl hover:bg-[#1A1A1A]/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-[#F4C430] text-[#1A1A1A] text-xs font-bold rounded-xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] hover:bg-[#F06E38] hover:text-white transition-colors uppercase tracking-wide">
              {loading ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
