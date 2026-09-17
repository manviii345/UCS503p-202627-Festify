import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import InteractivePassModal from './InteractivePassModal';
import RubberStamp3D from '../three/RubberStamp3D';
import EventDetailsModal from './EventDetailsModal';
import VenueMap from './VenueMap';

function QrPassCard({ reg }: { reg: any }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (reg.qrToken) {
      QRCode.toDataURL(reg.qrToken, { margin: 1, width: 200, color: { dark: '#1A1A1A', light: '#FFFFFF' } })
        .then(setQrUrl)
        .catch(console.error);
    }
  }, [reg.qrToken]);

  const isCheckedIn = reg.status === 'CHECKED_IN';

  return (
    <div className="bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-2xl p-5 shadow-[4px_4px_0px_#1A1A1A] flex flex-col sm:flex-row items-center gap-6">
      <div className="bg-white p-3 border-2 border-[#1A1A1A] rounded-xl shrink-0 flex flex-col items-center">
        {qrUrl ? (
          <img src={qrUrl} alt="Registration QR Pass" className="w-36 h-36 object-contain" />
        ) : (
          <div className="w-36 h-36 bg-gray-100 flex items-center justify-center text-xs text-gray-400">Loading QR...</div>
        )}
        <span className="text-[9px] font-mono font-bold text-[#1A1A1A]/60 mt-2 uppercase tracking-tighter">
          Pass #{reg.id}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border border-[#1A1A1A] ${
              isCheckedIn ? 'bg-[#10B981] text-white' : 'bg-[#F4C430] text-[#1A1A1A]'
            }`}>
              {isCheckedIn ? '✓ CHECKED IN' : '🎟 ACTIVE PASS'}
            </span>
            <span className="text-xs font-mono font-bold text-[#F06E38]">{reg.event?.category}</span>
          </div>

          <h3 className="text-xl font-black text-[#1A1A1A] uppercase tracking-tight">{reg.event?.name}</h3>
          <p className="text-xs font-bold text-[#1A1A1A]/70 mt-1">
            📅 {reg.event?.date} · 🕐 {reg.event?.startTime} · 📍 {reg.event?.venue}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#1A1A1A]/10 flex items-center justify-between text-[10px] font-bold text-[#1A1A1A]/50">
          <span>Registered: {new Date(reg.createdAt).toLocaleDateString()}</span>
          {isCheckedIn && <span>Checked-in: {new Date(reg.checkedInAt).toLocaleTimeString()}</span>}
        </div>
      </div>
    </div>
  );
}

export default function StudentUserView({ onBackToLanding, onOpenAdmin }: { onBackToLanding: () => void; onOpenAdmin: () => void }) {
  const [show3DPass, setShow3DPass] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showVenueMap, setShowVenueMap] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'passes'>('events');

  // Students view the default admin's fest (festId=1)
  const STUDENT_FEST_ID = 1;

  const fetchEvents = () => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(console.error);
  };

  const fetchMyRegistrations = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/registrations/my', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setRegistrations(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchEvents();
    fetchMyRegistrations();
  }, []);

  const filteredEvents = events.filter(ev => {
    const matchesSearch = ev.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || ev.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-[#F7F2E7] text-[#1A1A1A] font-fredoka py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b-2 border-[#1A1A1A]">
          <div>
            <span className="px-3.5 py-1 bg-[#F4C430] text-[#1A1A1A] text-xs font-bold rounded-full border border-[#1A1A1A] uppercase tracking-wider">
              STUDENT PASS EXPERIENCE
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-[#1A1A1A] mt-2">
              Discover & Access College Fest
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShow3DPass(true)}
              className="px-5 py-2.5 bg-[#EC6484] text-[#1A1A1A] font-bold text-xs rounded-full border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#F4C430] transition-colors"
            >
              🎟 VIEW 3D DIGITAL PASS
            </button>
            <button
              onClick={onBackToLanding}
              className="px-4 py-2.5 text-xs font-bold border-2 border-[#1A1A1A] rounded-full hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              Back to Landing
            </button>
          </div>
        </div>

        {/* Tab Toggle: Events vs My Passes */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-6 py-3 font-black text-sm rounded-2xl border-2 border-[#1A1A1A] transition-all ${
              activeTab === 'events'
                ? 'bg-[#1E1E1E] text-white shadow-[4px_4px_0px_#EC6484]'
                : 'bg-[#EFE8D8] text-[#1A1A1A] hover:bg-[#F4C430]'
            }`}
          >
            🎉 All Fest Events ({events.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('passes');
              fetchMyRegistrations();
            }}
            className={`px-6 py-3 font-black text-sm rounded-2xl border-2 border-[#1A1A1A] transition-all ${
              activeTab === 'passes'
                ? 'bg-[#1E1E1E] text-white shadow-[4px_4px_0px_#EC6484]'
                : 'bg-[#EFE8D8] text-[#1A1A1A] hover:bg-[#F4C430]'
            }`}
          >
            🎟 My Passes & QR Codes ({registrations.length})
          </button>
        </div>

        {activeTab === 'events' ? (
          <>
            {/* 3D Rubber Stamp Feature Seal */}
            <div className="mb-12 flex flex-col md:flex-row items-center justify-between bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_#1A1A1A]">
              <div>
                <span className="text-xs font-mono text-[#F06E38] font-bold uppercase tracking-wider">
                  Offline Ready PWA Guarantee
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] mt-1 mb-2">
                  No Network in Crowd? QR Pass Saved Locally
                </h2>
                <p className="text-sm text-[#1A1A1A]/80 max-w-xl font-medium">
                  Your gate ticket, event bookmarks, and schedule remain cached on device. Scan gates in 0.2 seconds offline.
                </p>

                <button
                  onClick={onOpenAdmin}
                  className="mt-4 px-6 py-3 bg-[#F06E38] text-white font-bold text-xs rounded-full border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#1E1E1E] transition-colors"
                >
                  TRY ADMIN DASHBOARD VIEW ➔
                </button>
              </div>

              <RubberStamp3D />
            </div>

            {/* Filters */}
            <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
              <input 
                type="text" 
                placeholder="Search events..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-72 p-3 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#EC6484]"
              />
              <div className="flex flex-wrap gap-2">
                {['All', 'Technical', 'Cultural', 'Sports', 'Workshop', 'Hackathon'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border-2 border-[#1A1A1A] transition-colors ${
                      categoryFilter === cat 
                        ? 'bg-[#1E1E1E] text-white shadow-[2px_2px_0px_#EC6484]' 
                        : 'bg-[#F7F2E7] text-[#1A1A1A] hover:bg-[#EFE8D8]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {filteredEvents.map((event) => (
                <div 
                  key={event.id}
                  className="bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#1A1A1A] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#1A1A1A] transition-all duration-300 flex flex-col group cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="h-48 w-full bg-[#1A1A1A] border-b-2 border-[#1A1A1A] relative overflow-hidden">
                    {event.image ? (
                      <img src={event.image} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#F4C430] opacity-80">
                        <span className="text-5xl font-black font-groovy uppercase">{event.name.slice(0, 2)}</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-1">
                      <span className="px-3 py-1 bg-[#F4C430] text-[#1A1A1A] text-[10px] font-bold rounded-full border border-[#1A1A1A] shadow-sm uppercase tracking-widest">
                        {event.category}
                      </span>
                      {event.remainingSeats !== undefined && (
                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full border border-[#1A1A1A] text-white ${
                          event.remainingSeats <= 0 ? 'bg-red-500' : 'bg-emerald-600'
                        }`}>
                          {event.remainingSeats} seats
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-xl font-black text-[#1A1A1A] mb-2 uppercase tracking-tight">{event.name}</h3>
                    <p className="text-sm font-medium text-[#1A1A1A]/70 line-clamp-2 mb-4">{event.description}</p>
                    
                    <div className="mt-auto space-y-2 text-xs font-bold text-[#1A1A1A]/60 uppercase tracking-widest">
                      <div className="flex items-center gap-2"><span>📅</span> {event.date}</div>
                      <div className="flex items-center gap-2"><span>🕐</span> {event.startTime}</div>
                      <div className="flex items-center gap-2"><span>📍</span> {event.venue}</div>
                    </div>

                    <div className="mt-6 pt-4 border-t-2 border-[#1A1A1A]/10 flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border border-[#1A1A1A] ${event.status === 'Upcoming' ? 'bg-[#EC6484] text-[#1A1A1A]' : 'bg-transparent text-[#1A1A1A]'}`}>
                        {event.status}
                      </span>
                      <button className="text-xs font-black text-[#F06E38] group-hover:text-[#1A1A1A] transition-colors">
                        View & Register ➔
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* My Passes Tab */
          <div className="mb-16">
            {registrations.length === 0 ? (
              <div className="bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-2xl p-12 text-center shadow-[4px_4px_0px_#1A1A1A]">
                <div className="text-5xl mb-3">🎟️</div>
                <h3 className="text-xl font-black text-[#1A1A1A] mb-2">No Event Passes Yet</h3>
                <p className="text-sm text-[#1A1A1A]/70 font-medium max-w-md mx-auto mb-6">
                  You haven't registered for any fest events. Browse the events tab and click "Register Now" to get your scannable QR ticket!
                </p>
                <button
                  onClick={() => setActiveTab('events')}
                  className="px-6 py-3 bg-[#EC6484] text-[#1A1A1A] font-black text-xs rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#F4C430] transition-colors"
                >
                  Browse Events ➔
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {registrations.map((reg) => (
                  <QrPassCard key={reg.id} reg={reg} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Venue Map Section ─────────────────────────────────────────────── */}
        <div className="mb-16">
          <div
            className="flex items-center justify-between mb-4 cursor-pointer"
            onClick={() => setShowVenueMap((v) => !v)}
            role="button"
            id="student-venue-map-toggle"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowVenueMap((v) => !v)}
          >
            <div>
              <span className="text-xs font-mono text-[#F06E38] font-bold uppercase tracking-wider">
                Campus Navigation
              </span>
              <h2 className="text-2xl font-black text-[#1A1A1A]">Interactive Venue Map</h2>
            </div>
            <button className="px-4 py-2 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-bold shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#F4C430] transition-colors">
              {showVenueMap ? '▲ Hide Map' : '🗺️ Show Map'}
            </button>
          </div>

          {showVenueMap && (
            <div className="bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-2xl p-4 sm:p-6 shadow-[4px_4px_0px_#1A1A1A]" style={{ minHeight: '520px' }}>
              <VenueMap festId={STUDENT_FEST_ID} readOnly />
            </div>
          )}

          {!showVenueMap && (
            <div
              className="bg-[#EFE8D8] border-2 border-[#1A1A1A] border-dashed rounded-2xl p-8 flex items-center justify-center gap-4 cursor-pointer hover:bg-[#F4C430]/20 transition-colors"
              onClick={() => setShowVenueMap(true)}
              id="student-venue-map-preview"
            >
              <span className="text-4xl">🗺️</span>
              <div>
                <p className="font-black text-[#1A1A1A]">Find your way around Aurora Fest</p>
                <p className="text-xs font-semibold text-[#1A1A1A]/60">Stages · Food Courts · Gates · First Aid · Parking</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {show3DPass && (
        <InteractivePassModal onClose={() => setShow3DPass(false)} />
      )}

      <EventDetailsModal 
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onRegistered={() => {
          fetchEvents();
          fetchMyRegistrations();
        }}
      />
    </div>
  );
}

