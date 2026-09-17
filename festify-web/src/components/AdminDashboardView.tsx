import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GateScannerCanvas from '../three/GateScannerCanvas';
import confetti from 'canvas-confetti';
import CreateEventModal from './CreateEventModal';
import VenueMap from './VenueMap';

interface EventItem {
  id: number;
  name: string;
  date: string;
  startTime: string;
  venue: string;
  maxParticipants: number;
  status: string;
  capacity?: string;
  capacityRatio?: number;
}

interface RegistrationItem {
  id: number;
  name: string;
  college: string;
  event: string;
  payment: 'Paid' | 'Pending';
  date: string;
}
const INITIAL_REGISTRATIONS: RegistrationItem[] = [
  { id: 1, name: 'Aarav Kapoor', college: 'IIT Bombay', event: 'Battle of Bands', payment: 'Paid', date: 'Nov 3, 2026' },
  { id: 2, name: 'Riya Desai', college: 'VJTI Mumbai', event: 'Hackathon 2026', payment: 'Paid', date: 'Nov 5, 2026' },
  { id: 3, name: 'Kunal Mehta', college: 'NMIMS Mumbai', event: 'Stand-up Comedy', payment: 'Pending', date: 'Nov 6, 2026' },
  { id: 4, name: 'Prachi Joshi', college: 'IIT Bombay', event: 'Classical Dance Night', payment: 'Paid', date: 'Nov 7, 2026' },
  { id: 5, name: 'Siddharth Roy', college: 'Thadomal Shahani', event: 'Photography Exhibition', payment: 'Pending', date: 'Nov 8, 2026' },
  { id: 6, name: 'Ananya Pillai', college: 'IIT Bombay', event: 'Battle of Bands', payment: 'Paid', date: 'Nov 9, 2026' },
  { id: 7, name: 'Rohit Bose', college: 'DJ Sanghvi', event: 'Hackathon 2026', payment: 'Paid', date: 'Nov 9, 2026' },
  { id: 8, name: 'Tanvi Nair', college: 'KJSCE Mumbai', event: 'Stand-up Comedy', payment: 'Pending', date: 'Nov 10, 2026' },
  { id: 9, name: 'Vivek Shah', college: 'IIT Bombay', event: 'Classical Dance Night', payment: 'Paid', date: 'Nov 10, 2026' },
  { id: 10, name: 'Pooja Venkat', college: 'Mumbai University', event: 'Battle of Bands', payment: 'Paid', date: 'Nov 11, 2026' },
  { id: 11, name: 'Harsh Agarwal', college: 'BITS Pilani', event: 'Hackathon 2026', payment: 'Paid', date: 'Nov 11, 2026' },
];

export default function AdminDashboardView({ onBackToLanding }: { onBackToLanding: () => void }) {
  // Parse the admin's user ID from the stored JWT for tenant-scoped venue queries
  const adminFestId = (() => {
    try {
      const token = localStorage.getItem('festify_token') || localStorage.getItem('token');
      if (!token) return 1;
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'ADMIN' && typeof payload.id === 'number') {
        return payload.id;
      }
      return 1;
    } catch { return 1; }
  })();

  const [activeSidebarTab, setActiveSidebarTab] = useState<'dashboard' | 'events' | 'registrations' | 'scanner' | 'venue'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [isScanning, setIsScanning] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [liveRegistrations, setLiveRegistrations] = useState(4821);
  const [events, setEvents] = useState<EventItem[]>([]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('festify_token');
      const res = await fetch('/api/admin/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Trigger 3D scanner animation & increment checkin
  const handleTriggerScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLiveRegistrations(prev => prev + 1);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    }, 1500);
  };

  const filteredRegistrations = INITIAL_REGISTRATIONS.filter(reg => {
    const matchesSearch = reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          reg.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          reg.event.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPayment = paymentFilter === 'All' || reg.payment === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  return (
    <div className="min-h-screen bg-[#F7F2E7] text-[#1A1A1A] flex flex-col md:flex-row font-fredoka antialiased">
      {/* ──────────────────────────────────────────────────
          DARK SIDEBAR (#1E1E1E) matching Screenshot 2 & 3
      ────────────────────────────────────────────────── */}
      <aside className="w-full md:w-20 bg-[#1E1E1E] text-white flex md:flex-col items-center justify-between p-4 shrink-0 border-b md:border-b-0 md:border-r border-[#1A1A1A] z-20">
        <div className="flex md:flex-col items-center gap-6 w-full">
          {/* Top Logo Badge 'F' */}
          <button
            onClick={onBackToLanding}
            title="Back to Festify Landing Page"
            className="w-10 h-10 rounded-full bg-[#F4C430] text-[#1A1A1A] font-groovy font-bold text-xl flex items-center justify-center shadow-md hover:scale-105 transition-transform"
          >
            F
          </button>

          {/* Navigation Icons */}
          <nav className="flex md:flex-col items-center gap-3">
            {/* Dashboard Overview Icon */}
            <button
              onClick={() => setActiveSidebarTab('dashboard')}
              title="Dashboard Overview"
              className={`p-2.5 rounded-xl transition-all ${
                activeSidebarTab === 'dashboard'
                  ? 'bg-[#EC6484] text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z"/>
              </svg>
            </button>

            {/* Event Management Icon */}
            <button
              onClick={() => setActiveSidebarTab('events')}
              title="Event Management"
              className={`p-2.5 rounded-xl transition-all ${
                activeSidebarTab === 'events'
                  ? 'bg-[#EC6484] text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>

            {/* Registrations Icon */}
            <button
              onClick={() => setActiveSidebarTab('registrations')}
              title="Registrations Table"
              className={`p-2.5 rounded-xl transition-all ${
                activeSidebarTab === 'registrations'
                  ? 'bg-[#EC6484] text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </button>

            {/* 3D Gate Scanner Pass Icon */}
            <button
              onClick={() => setActiveSidebarTab('scanner')}
              title="3D Gate Scanner"
              className={`p-2.5 rounded-xl transition-all ${
                activeSidebarTab === 'scanner'
                  ? 'bg-[#EC6484] text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <path d="M14 14h3v3h-3zM18 18h3v3h-3z"/>
              </svg>
            </button>

            {/* Venue Map Icon */}
            <button
              onClick={() => setActiveSidebarTab('venue')}
              title="Venue Map"
              id="admin-sidebar-venue"
              className={`p-2.5 rounded-xl transition-all ${
                activeSidebarTab === 'venue'
                  ? 'bg-[#EC6484] text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </button>
          </nav>
        </div>

        {/* Bottom Avatar Badge 'AD' */}
        <div className="w-10 h-10 rounded-full bg-[#F06E38] text-white font-bold text-xs flex items-center justify-center shadow-md">
          AD
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────
          MAIN ADMIN DASHBOARD CONTENT AREA
      ────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-[#1A1A1A]/10">
          <div>
            <span className="text-xs font-mono tracking-widest text-[#1A1A1A]/60 uppercase">
              Good morning —
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] capitalize">
              {activeSidebarTab === 'dashboard' ? 'Dashboard'
                : activeSidebarTab === 'events' ? 'Event Management'
                : activeSidebarTab === 'venue' ? 'Venue Map'
                : 'Registrations'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 bg-[#F4C430] text-[#1A1A1A] font-bold text-xs rounded-full border border-[#1A1A1A] shadow-sm uppercase tracking-wide">
              AURORA FEST 2026
            </span>
            <div className="w-8 h-8 rounded-full bg-[#F06E38] text-white text-xs font-bold flex items-center justify-center border border-[#1A1A1A]">
              AD
            </div>
            <button
              onClick={onBackToLanding}
              className="hidden sm:inline-flex px-3 py-1.5 text-xs font-bold border border-[#1A1A1A] rounded-full hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              Exit Dashboard ➔
            </button>
          </div>
        </header>

        {/* ──────────────────────────────────────────────────
            VIEW 1: DASHBOARD OVERVIEW (Screenshot 2)
        ────────────────────────────────────────────────── */}
        {activeSidebarTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Live Fest Banner Card */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] bg-[#1E1E1E] text-white p-6 sm:p-10">
              {/* Background Concert Crowd Overlay */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E] via-[#1E1E1E]/80 to-transparent" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EC6484] text-[#1A1A1A] text-xs font-bold rounded-full uppercase tracking-wider mb-4 border border-[#1A1A1A]">
                    ● LIVE EDITION 2026
                  </span>

                  <h2 className="text-4xl sm:text-6xl font-black text-[#F4C430] tracking-tight mb-2 uppercase drop-shadow-md">
                    AURORA FEST
                  </h2>

                  <p className="text-sm sm:text-base text-gray-300 flex flex-wrap items-center gap-4 font-medium">
                    <span>📅 November 14–16, 2026</span>
                    <span>📍 IIT Bombay, Mumbai</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setShowCreateEventModal(true)}
                    className="px-5 py-2.5 bg-[#1E1E1E] text-white text-xs font-bold rounded-xl border border-white/30 hover:bg-white hover:text-[#1A1A1A] transition-colors"
                  >
                    + Create Event
                  </button>

                  <button
                    onClick={() => setShowNotificationModal(true)}
                    className="px-5 py-2.5 bg-[#EC6484] text-[#1A1A1A] text-xs font-bold rounded-xl border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#F4C430] transition-colors"
                  >
                    ✉ Send Notification
                  </button>
                </div>
              </div>
            </div>

            {/* 
              TODO: REAL-TIME PUSH SEAM (Socket.IO & Redis)
              Currently, these metric cards render static overview numbers and local React state.
              Future architecture integration point:
                1. Socket.IO client hook: subscribe to 'fest:metrics:update' room for live attendee / registration counters.
                2. Redis ephemeral crowd telemetry: buffer gate check-in pings in Redis hyperloglog / pubsub before flushing.
            */}
            {/* 3 Metric Cards Row matching Screenshot 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Metric 1 */}
              <div className="dashboard-card p-6 flex flex-col justify-between shadow-[3px_3px_0px_#1A1A1A]">
                <div className="w-10 h-10 rounded-xl bg-[#F4C430] border-2 border-[#1A1A1A] flex items-center justify-center mb-4 shadow-sm">
                  <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                  </svg>
                </div>
                <div>
                  <div className="text-4xl font-black text-[#1A1A1A]">24</div>
                  <div className="text-xs text-[#1A1A1A]/70 font-semibold mt-1">Across 3 days · Total Events</div>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="dashboard-card p-6 flex flex-col justify-between shadow-[3px_3px_0px_#1A1A1A]">
                <div className="w-10 h-10 rounded-xl bg-[#EC6484] border-2 border-[#1A1A1A] flex items-center justify-center mb-4 shadow-sm">
                  <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <div className="text-4xl font-black text-[#1A1A1A]">{liveRegistrations.toLocaleString()}</div>
                  <div className="text-xs text-[#1A1A1A]/70 font-semibold mt-1">+312 today · Total Registrations</div>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="dashboard-card p-6 flex flex-col justify-between shadow-[3px_3px_0px_#1A1A1A]">
                <div className="w-10 h-10 rounded-xl bg-[#F06E38] border-2 border-[#1A1A1A] flex items-center justify-center mb-4 shadow-sm">
                  <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-4xl font-black text-[#1A1A1A]">3,940</div>
                  <div className="text-xs text-[#1A1A1A]/70 font-semibold mt-1">81.7% coverage · QR Issued</div>
                </div>
              </div>
            </div>

            {/* 3D Gate Scanner Component Container */}
            <div className="dashboard-card p-6 shadow-[4px_4px_0px_#1A1A1A]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#1A1A1A]/10">
                <div>
                  <span className="text-xs font-mono text-[#F06E38] font-bold uppercase tracking-wider">
                    3D Interactive Gate Terminal
                  </span>
                  <h3 className="text-xl font-bold text-[#1A1A1A]">Sub-Second QR Entry Verification</h3>
                </div>
                <button
                  onClick={handleTriggerScan}
                  disabled={isScanning}
                  className="px-5 py-2.5 bg-[#F06E38] text-white font-bold text-xs rounded-full border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#EC6484] transition-colors"
                >
                  {isScanning ? 'SCANNING TICKET... ⚡' : '+ SIMULATE QR SCAN'}
                </button>
              </div>

              <GateScannerCanvas isScanning={isScanning} />
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────
            VIEW 2: EVENT MANAGEMENT (Screenshot 2 bottom)
        ────────────────────────────────────────────────── */}
        {activeSidebarTab === 'events' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#1A1A1A]">Event Management</h2>
              <button
                onClick={() => setShowCreateEventModal(true)}
                className="px-4 py-2 bg-[#1E1E1E] text-white font-bold text-xs rounded-xl border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#F06E38] transition-colors"
              >
                + Create Event
              </button>
            </div>

            <div className="space-y-4">
              {events.map(ev => (
                <div key={ev.id} className="dashboard-card p-5 shadow-[3px_3px_0px_#1A1A1A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#F06E38] transition-colors">
                  <div>
                    <h3 className="text-lg font-black text-[#1A1A1A]">{ev.name}</h3>
                    <p className="text-xs text-[#1A1A1A]/70 font-semibold mt-0.5">
                      {ev.date} · {ev.startTime} · <span className="text-[#1A1A1A]">{ev.venue}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#1A1A1A]">0/{ev.maxParticipants}</div>
                      <div className="text-[10px] text-[#1A1A1A]/60 uppercase tracking-wider">capacity</div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          if (confirm('Delete this event?')) {
                            const token = localStorage.getItem('festify_token');
                            await fetch(`/api/admin/events/${ev.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
                            fetchEvents();
                          }
                        }}
                        className="px-3 py-1 rounded-full text-xs font-bold border border-[#1A1A1A] bg-red-100 hover:bg-red-200 text-red-600"
                      >
                        Delete
                      </button>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border border-[#1A1A1A] ${
                        ev.status === 'Live' ? 'bg-[#EC6484] text-[#1A1A1A]' : 'bg-[#F4C430] text-[#1A1A1A]'
                      }`}>
                        {ev.status === 'Live' ? '● Live' : 'Scheduled'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────
            VIEW 3: REGISTRATIONS (Screenshot 3 bottom)
        ────────────────────────────────────────────────── */}
        {(activeSidebarTab === 'registrations' || activeSidebarTab === 'scanner') && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-[#1A1A1A]">Registrations</h2>

            {/* Metric Summary Badges */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="px-4 py-2 rounded-full border-2 border-[#1A1A1A] bg-[#F4C430]/20 font-bold text-xs text-[#1A1A1A]">
                ● 12 Registered
              </span>
              <span className="px-4 py-2 rounded-full border-2 border-[#1A1A1A] bg-[#F06E38]/20 font-bold text-xs text-[#1A1A1A]">
                ● 8 Paid
              </span>
              <span className="px-4 py-2 rounded-full border-2 border-[#1A1A1A] bg-[#EC6484]/20 font-bold text-xs text-[#1A1A1A]">
                ● 4 Pending Payment
              </span>
            </div>

            {/* Filter Tabs & Search Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {(['All', 'Paid', 'Pending'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setPaymentFilter(tab)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border border-[#1A1A1A] transition-colors ${
                      paymentFilter === tab ? 'bg-[#1E1E1E] text-white' : 'bg-[#EFE8D8] text-[#1A1A1A] hover:bg-[#1A1A1A]/10'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search student or college..."
                className="w-full sm:w-72 px-4 py-2 rounded-full bg-[#EFE8D8] border-2 border-[#1A1A1A] text-xs font-semibold placeholder:text-[#1A1A1A]/50 focus:outline-none focus:ring-2 focus:ring-[#F06E38]"
              />
            </div>

            {/* Table matching Screenshot 3 */}
            <div className="rounded-2xl border-2 border-[#1A1A1A] overflow-hidden shadow-[4px_4px_0px_#1A1A1A] bg-[#EFE8D8]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-[#1E1E1E] text-white uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">College</th>
                      <th className="p-4">Event</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Reg. Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]/10">
                    {filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-[#1A1A1A]/5 transition-colors">
                        <td className="p-4 font-bold text-[#1A1A1A]">{reg.name}</td>
                        <td className="p-4 text-[#1A1A1A]/70">{reg.college}</td>
                        <td className="p-4 text-[#1A1A1A]">{reg.event}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border border-[#1A1A1A] ${
                            reg.payment === 'Paid' ? 'bg-[#F06E38]/20 text-[#D94E28]' : 'bg-[#EC6484]/20 text-[#EC6484]'
                          }`}>
                            {reg.payment}
                          </span>
                        </td>
                        <td className="p-4 text-[#1A1A1A]/60">{reg.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────
            VIEW 5: VENUE MAP
        ────────────────────────────────────────────────── */}
        {activeSidebarTab === 'venue' && (
          <div className="h-full" style={{ minHeight: '600px' }}>
            <VenueMap festId={adminFestId} />
          </div>
        )}
      </main>

      {/* Notification Modal */}
      <AnimatePresence>
        {showNotificationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#F7F2E7] border-2 border-[#1A1A1A] rounded-2xl p-6 max-w-md w-full shadow-[6px_6px_0px_#1A1A1A]"
            >
              <h3 className="text-xl font-black text-[#1A1A1A] mb-2">✉ Send Emergency Alert Broadcast</h3>
              <p className="text-xs text-[#1A1A1A]/70 mb-4">Push lock-screen alert directly to all fest registrants.</p>

              <textarea
                rows={3}
                placeholder="e.g. Battle of Bands shifted to Ampitheatre due to rain..."
                className="w-full p-3 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold mb-4 focus:outline-none"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="px-4 py-2 text-xs font-bold border border-[#1A1A1A] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowNotificationModal(false);
                    confetti({ particleCount: 30 });
                  }}
                  className="px-4 py-2 bg-[#EC6484] text-[#1A1A1A] text-xs font-bold rounded-xl border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]"
                >
                  DISPATCH ALERT ➔
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Event Modal */}
      <CreateEventModal 
        isOpen={showCreateEventModal} 
        onClose={() => setShowCreateEventModal(false)}
        onSuccess={fetchEvents}
      />
    </div>
  );
}
