import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GateScannerCanvas from '../three/GateScannerCanvas';
import confetti from 'canvas-confetti';
import CreateEventModal from './CreateEventModal';
import VenueMap from './VenueMap';
import CameraQrScanner from './CameraQrScanner';
import AssistantPanel from './AssistantPanel';

interface EventItem {
  id: number;
  name: string;
  date: string;
  startTime: string;
  venue: string;
  maxParticipants: number;
  registeredCount: number;
  checkedInCount: number;
  remainingSeats: number;
  fillRate: number;
  status: string;
  zone?: {
    id: number;
    name: string;
    category: string;
    color: string;
  };
}

interface RegistrationItem {
  id: number;
  name: string;
  event: string;
  status: string;
  date: string;
  checkedInAt?: string;
}

interface AdminStats {
  totalRegistrations: number;
  totalCheckedIn: number;
  totalEvents: number;
  totalSeats: number;
  overallFillRate: number;
  events: EventItem[];
  recentRegistrations: RegistrationItem[];
}

export default function AdminDashboardView({ onBackToLanding }: { onBackToLanding: () => void }) {
  const adminFestId = (() => {
    try {
      const token = localStorage.getItem('festify_token');
      if (!token) return 1;
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'ADMIN' && typeof payload.id === 'number') {
        return payload.id;
      }
      return 1;
    } catch { return 1; }
  })();

  const [activeSidebarTab, setActiveSidebarTab] = useState<'dashboard' | 'events' | 'registrations' | 'scanner' | 'venue' | 'assistant'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'REGISTERED' | 'CHECKED_IN'>('All');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResultFeedback, setScanResultFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Notification Modal State
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTargetType, setNotifTargetType] = useState<'fest' | 'event'>('fest');
  const [notifTargetEventId, setNotifTargetEventId] = useState<string>('');
  const [notifSending, setNotifSending] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);

  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalRegistrations: 0,
    totalCheckedIn: 0,
    totalEvents: 0,
    totalSeats: 0,
    overallFillRate: 0,
    events: [],
    recentRegistrations: []
  });

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('festify_token');
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats', error);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const handleQrScanToken = async (qrToken: string) => {
    setIsScanning(true);
    setScanResultFeedback(null);
    const token = localStorage.getItem('festify_token');

    try {
      const res = await fetch('/api/registrations/scan-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ qrToken })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setScanResultFeedback({
          type: 'success',
          message: `✅ Check-in Success! ${data.registration?.user?.username || 'Student'} verified for ${data.registration?.event?.name || 'Event'}`
        });
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
        fetchAdminStats();
      } else {
        setScanResultFeedback({
          type: 'error',
          message: `❌ ${data.error || 'Check-in failed'}`
        });
      }
    } catch (err) {
      setScanResultFeedback({
        type: 'error',
        message: '❌ Error processing check-in'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleDispatchNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifMessage.trim()) return;

    setNotifSending(true);
    const token = localStorage.getItem('festify_token');

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: notifMessage.trim(),
          targetType: notifTargetType,
          targetEventId: notifTargetType === 'event' ? Number(notifTargetEventId) : null
        })
      });

      if (res.ok) {
        confetti({ particleCount: 40 });
        setShowNotificationModal(false);
        setNotifMessage('');
        alert('Notification broadcasted successfully!');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to send notification');
      }
    } catch (err) {
      alert('Error sending notification');
    } finally {
      setNotifSending(false);
    }
  };

  const handleAiDraftNotification = async () => {
    setAiDrafting(true);
    const token = localStorage.getItem('festify_token');
    try {
      const res = await fetch('/api/assistant/draft-announcement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: notifTargetEventId ? Number(notifTargetEventId) : undefined,
          update_type: notifTargetType === 'event' ? 'event_update' : 'reminder',
          key_details: notifMessage || 'Festival activities starting in 15 minutes at central quad'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.announcement) {
          setNotifMessage(data.announcement);
        }
      }
    } catch (err) {
      console.error('Failed to draft announcement with AI', err);
    } finally {
      setAiDrafting(false);
    }
  };


  const filteredRegistrations = stats.recentRegistrations.filter(reg => {
    const matchesSearch = reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          reg.event.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || reg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#F7F2E7] text-[#1A1A1A] flex flex-col md:flex-row font-fredoka antialiased">
      <aside className="w-full md:w-20 bg-[#1E1E1E] text-white flex md:flex-col items-center justify-between p-4 shrink-0 border-b md:border-b-0 md:border-r border-[#1A1A1A] z-20">
        <div className="flex md:flex-col items-center gap-6 w-full">
          <button
            onClick={onBackToLanding}
            title="Back to Festify Landing Page"
            className="w-10 h-10 rounded-full bg-[#F4C430] text-[#1A1A1A] font-groovy font-bold text-xl flex items-center justify-center shadow-md hover:scale-105 transition-transform"
          >
            F
          </button>

          <nav className="flex md:flex-col items-center gap-3">
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

            <button
              onClick={() => setActiveSidebarTab('scanner')}
              title="Camera QR Gate Scanner"
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

            <button
              onClick={() => setActiveSidebarTab('assistant')}
              title="AI Assistant Copilot"
              className={`p-2.5 rounded-xl transition-all ${
                activeSidebarTab === 'assistant'
                  ? 'bg-[#EC6484] text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-base">🤖</span>
            </button>
          </nav>
        </div>

        <div className="w-10 h-10 rounded-full bg-[#F06E38] text-white font-bold text-xs flex items-center justify-center shadow-md">
          AD
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-[#1A1A1A]/10">
          <div>
            <span className="text-xs font-mono tracking-widest text-[#1A1A1A]/60 uppercase">
              Organizer Panel —
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] capitalize">
              {activeSidebarTab === 'dashboard' ? 'Dashboard Overview'
                : activeSidebarTab === 'events' ? 'Event Management'
                : activeSidebarTab === 'venue' ? 'Venue Map & Zones'
                : activeSidebarTab === 'scanner' ? 'Live Camera QR Gate Scanner'
                : activeSidebarTab === 'assistant' ? 'Festify AI Organizer Copilot'
                : 'Registrations'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 bg-[#F4C430] text-[#1A1A1A] font-bold text-xs rounded-full border border-[#1A1A1A] shadow-sm uppercase tracking-wide">
              Fest Tenant #{adminFestId}
            </span>
            <button
              onClick={() => {
                localStorage.removeItem('festify_token');
                localStorage.removeItem('festify_role');
                onBackToLanding();
              }}
              className="hidden sm:inline-flex px-3 py-1.5 text-xs font-bold border border-[#1A1A1A] rounded-full hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              Exit Dashboard ➔
            </button>
          </div>
        </header>

        {activeSidebarTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] bg-[#1E1E1E] text-white p-6 sm:p-10">
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
                    ● LIVE ORGANIZER HUB
                  </span>

                  <h2 className="text-4xl sm:text-5xl font-black text-[#F4C430] tracking-tight mb-2 uppercase drop-shadow-md">
                    Festify Tenant Dashboard
                  </h2>

                  <p className="text-sm text-gray-300 flex flex-wrap items-center gap-4 font-medium">
                    <span>⚡ Live Pass Validation</span>
                    <span>📍 Venue Map & Zone Linking</span>
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
                    ✉ Send Broadcast Alert
                  </button>
                </div>
              </div>
            </div>

            {/* Real Tenant Overview Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="dashboard-card p-6 flex flex-col justify-between shadow-[3px_3px_0px_#1A1A1A]">
                <div className="w-10 h-10 rounded-xl bg-[#F4C430] border-2 border-[#1A1A1A] flex items-center justify-center mb-4 shadow-sm">
                  📅
                </div>
                <div>
                  <div className="text-4xl font-black text-[#1A1A1A]">{stats.totalEvents}</div>
                  <div className="text-xs text-[#1A1A1A]/70 font-semibold mt-1">Total Managed Events</div>
                </div>
              </div>

              <div className="dashboard-card p-6 flex flex-col justify-between shadow-[3px_3px_0px_#1A1A1A]">
                <div className="w-10 h-10 rounded-xl bg-[#EC6484] border-2 border-[#1A1A1A] flex items-center justify-center mb-4 shadow-sm">
                  🎟️
                </div>
                <div>
                  <div className="text-4xl font-black text-[#1A1A1A]">{stats.totalRegistrations}</div>
                  <div className="text-xs text-[#1A1A1A]/70 font-semibold mt-1">Total Student Registrations</div>
                </div>
              </div>

              <div className="dashboard-card p-6 flex flex-col justify-between shadow-[3px_3px_0px_#1A1A1A]">
                <div className="w-10 h-10 rounded-xl bg-[#F06E38] border-2 border-[#1A1A1A] flex items-center justify-center mb-4 shadow-sm">
                  ✅
                </div>
                <div>
                  <div className="text-4xl font-black text-[#1A1A1A]">{stats.totalCheckedIn}</div>
                  <div className="text-xs text-[#1A1A1A]/70 font-semibold mt-1">Gate Check-Ins Completed</div>
                </div>
              </div>

              <div className="dashboard-card p-6 flex flex-col justify-between shadow-[3px_3px_0px_#1A1A1A]">
                <div className="w-10 h-10 rounded-xl bg-[#4A7C59] border-2 border-[#1A1A1A] flex items-center justify-center mb-4 text-white shadow-sm font-bold">
                  %
                </div>
                <div>
                  <div className="text-4xl font-black text-[#1A1A1A]">{stats.overallFillRate}%</div>
                  <div className="text-xs text-[#1A1A1A]/70 font-semibold mt-1">Overall Event Fill Rate</div>
                </div>
              </div>
            </div>

            {/* 3D & Camera Gate Scanner */}
            <div className="dashboard-card p-6 shadow-[4px_4px_0px_#1A1A1A]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#1A1A1A]/10">
                <div>
                  <span className="text-xs font-mono text-[#F06E38] font-bold uppercase tracking-wider">
                    Gate Check-In Terminal
                  </span>
                  <h3 className="text-xl font-bold text-[#1A1A1A]">Live Camera & Token Validation</h3>
                </div>
              </div>

              {scanResultFeedback && (
                <div className={`p-4 mb-4 rounded-xl border-2 border-[#1A1A1A] font-bold text-xs ${
                  scanResultFeedback.type === 'success' ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                }`}>
                  {scanResultFeedback.message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <GateScannerCanvas isScanning={isScanning} />
                <CameraQrScanner onScanSuccess={handleQrScanToken} />
              </div>
            </div>
          </div>
        )}

        {activeSidebarTab === 'scanner' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-[#1A1A1A]">Gate Camera QR Scanner</h2>
            {scanResultFeedback && (
              <div className={`p-4 rounded-xl border-2 border-[#1A1A1A] font-bold text-xs ${
                scanResultFeedback.type === 'success' ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
              }`}>
                {scanResultFeedback.message}
              </div>
            )}
            <CameraQrScanner onScanSuccess={handleQrScanToken} />
          </div>
        )}

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
              {stats.events.map(ev => (
                <div key={ev.id} className="dashboard-card p-5 shadow-[3px_3px_0px_#1A1A1A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#F06E38] transition-colors">
                  <div>
                    <h3 className="text-lg font-black text-[#1A1A1A]">{ev.name}</h3>
                    <p className="text-xs text-[#1A1A1A]/70 font-semibold mt-0.5">
                      {ev.date} · {ev.startTime} · <span className="text-[#1A1A1A] font-bold">{ev.venue}</span>
                      {ev.zone && (
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: ev.zone.color || '#F06E38' }}>
                          📍 Zone: {ev.zone.name}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#1A1A1A]">{ev.registeredCount}/{ev.maxParticipants} ({ev.fillRate}% fill)</div>
                      <div className="text-[10px] text-[#1A1A1A]/60 uppercase tracking-wider">{ev.checkedInCount} checked in</div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          if (confirm('Delete this event?')) {
                            const token = localStorage.getItem('festify_token');
                            await fetch(`/api/admin/events/${ev.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
                            fetchAdminStats();
                          }
                        }}
                        className="px-3 py-1 rounded-full text-xs font-bold border border-[#1A1A1A] bg-red-100 hover:bg-red-200 text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSidebarTab === 'registrations' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-[#1A1A1A]">Real Registrations Log</h2>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {(['All', 'REGISTERED', 'CHECKED_IN'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border border-[#1A1A1A] transition-colors ${
                      statusFilter === tab ? 'bg-[#1E1E1E] text-white' : 'bg-[#EFE8D8] text-[#1A1A1A] hover:bg-[#1A1A1A]/10'
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
                placeholder="Search username or event..."
                className="w-full sm:w-72 px-4 py-2 rounded-full bg-[#EFE8D8] border-2 border-[#1A1A1A] text-xs font-semibold placeholder:text-[#1A1A1A]/50 focus:outline-none focus:ring-2 focus:ring-[#F06E38]"
              />
            </div>

            <div className="rounded-2xl border-2 border-[#1A1A1A] overflow-hidden shadow-[4px_4px_0px_#1A1A1A] bg-[#EFE8D8]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-[#1E1E1E] text-white uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Student</th>
                      <th className="p-4">Event</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Reg. Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]/10">
                    {filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-xs text-gray-500">
                          No registrations found.
                        </td>
                      </tr>
                    ) : (
                      filteredRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-[#1A1A1A]/5 transition-colors">
                          <td className="p-4 font-bold text-[#1A1A1A]">{reg.name}</td>
                          <td className="p-4 text-[#1A1A1A]">{reg.event}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border border-[#1A1A1A] ${
                              reg.status === 'CHECKED_IN' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                            }`}>
                              {reg.status}
                            </span>
                          </td>
                          <td className="p-4 text-[#1A1A1A]/60">{reg.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSidebarTab === 'venue' && (
          <div className="h-full" style={{ minHeight: '600px' }}>
            <VenueMap festId={adminFestId} />
          </div>
        )}

        {activeSidebarTab === 'assistant' && (
          <div className="max-w-3xl mx-auto">
            <AssistantPanel role="ADMIN" />
          </div>
        )}
      </main>

      {/* Broadcast Notification Modal */}
      <AnimatePresence>
        {showNotificationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#F7F2E7] border-2 border-[#1A1A1A] rounded-2xl p-6 max-w-md w-full shadow-[6px_6px_0px_#1A1A1A]"
            >
              <h3 className="text-xl font-black text-[#1A1A1A] mb-2">✉ Dispatch Notification Alert</h3>
              <p className="text-xs text-[#1A1A1A]/70 mb-4">Send lock-screen alerts to fest attendees or specific event registrants.</p>

              <form onSubmit={handleDispatchNotification} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Target Scope</label>
                  <select
                    value={notifTargetType}
                    onChange={(e) => setNotifTargetType(e.target.value as 'fest' | 'event')}
                    className="w-full p-2.5 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold"
                  >
                    <option value="fest">📢 All Fest Attendees (Fest-Wide)</option>
                    <option value="event">🎯 Specific Event Registrants Only</option>
                  </select>
                </div>

                {notifTargetType === 'event' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Select Event</label>
                    <select
                      required
                      value={notifTargetEventId}
                      onChange={(e) => setNotifTargetEventId(e.target.value)}
                      className="w-full p-2.5 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold"
                    >
                      <option value="">-- Choose Target Event --</option>
                      {stats.events.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70">Alert Message *</label>
                    <button
                      type="button"
                      onClick={handleAiDraftNotification}
                      disabled={aiDrafting}
                      className="text-[10px] font-bold px-2 py-0.5 bg-[#4A7C59] text-white rounded-lg border border-[#1A1A1A] hover:bg-[#3B6447] transition-colors flex items-center gap-1 shadow-sm"
                    >
                      ✨ {aiDrafting ? 'Drafting...' : 'Draft with AI'}
                    </button>
                  </div>
                  <textarea
                    required
                    rows={3}
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="e.g. Battle of Bands shifted to Ampitheatre due to rain..."
                    className="w-full p-3 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNotificationModal(false)}
                    className="px-4 py-2 text-xs font-bold border border-[#1A1A1A] rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={notifSending}
                    className="px-4 py-2 bg-[#EC6484] text-[#1A1A1A] text-xs font-bold rounded-xl border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#F4C430] transition-colors"
                  >
                    {notifSending ? 'DISPATCHING...' : 'DISPATCH ALERT ➔'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreateEventModal 
        isOpen={showCreateEventModal} 
        onClose={() => setShowCreateEventModal(false)}
        onSuccess={fetchAdminStats}
      />
    </div>
  );
}
