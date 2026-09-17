import type { StudentFeature, OrganizerFeature, DashboardStat, StatStrip } from './types';

/* ─── Festival config ─── */
export const FEST_CONFIG = {
  name:      'Festify',
  tagline:   'The all-in-one platform for unforgettable college fests — registrations, schedules, QR gates, and organizer dashboards, all in one ink-stamped package.',
  startDate: 'SEP 20',
  endDate:   'SEP 22, 2026',
  college:   'THAPAR INSTITUTE · PATIALA',
  edition:   '2026 EDITION',
};

/* ─── Nav links ─── */
export const NAV_LINKS = [
  { label: 'For Students',    href: '#students'   },
  { label: 'For Organizers',  href: '#organizers' },
  { label: 'Stats',           href: '#stats'      },
];

/* ─── Student feature cards ─── */
export const STUDENT_FEATURES: StudentFeature[] = [
  {
    id: 1,
    stampNo: 'STAMP № 01',
    denomination: '10¢',
    tag: 'SEARCH ENGINE',
    title: 'Event Discovery',
    description: 'Browse hackathons, battle-of-bands, and celebrity keynotes across categories — even offline.',
    // Magnifying glass icon path
    iconPath: 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  },
  {
    id: 2,
    stampNo: 'STAMP № 02',
    denomination: '25¢',
    tag: 'GATE PASS',
    title: 'Registration & QR Pass',
    description: 'One-tap registration. Instant QR code generated on device — no queues, no paper.',
    // QR code icon path
    iconPath: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm14 3h1v1h-1v-1zm-3 0h1v1h-1v-1zm1-3h1v1h-1v-1zm3 0h1v1h-1v-1zm1 3h-1v3h3v-3h-2zm-5 0v3h1v-1h1v-2h-2z',
  },
  {
    id: 3,
    stampNo: 'STAMP № 03',
    denomination: '15¢',
    tag: 'CHRONOMETER',
    title: 'Live Schedule',
    description: 'Real-time timetable with push alerts for schedule changes, surprise acts, and winners.',
    // Clock icon path
    iconPath: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v5.5l3.5 2',
  },
  {
    id: 4,
    stampNo: 'STAMP № 04',
    denomination: '30¢',
    tag: 'CARTOGRAPHY',
    title: 'Interactive Venue Map',
    description: 'Navigate stages, food stalls, and first-aid posts across the campus with a live vector map.',
    // Map pin icon path
    iconPath: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z',
  },
  {
    id: 5,
    stampNo: 'STAMP № 05',
    denomination: '50¢',
    tag: 'AIR TELEGRAPH',
    title: 'Notifications',
    description: 'Lock-screen push broadcasts for emergency updates, rain shifts, and stage changes — no SMS lag.',
    // Bell icon path
    iconPath: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  },
];

/* ─── Organizer feature cards ─── */
export const ORGANIZER_FEATURES: OrganizerFeature[] = [
  {
    id: 1,
    stampNo: 'STAMP № A',
    denomination: '10¢',
    tag: 'COMMAND POST',
    title: 'Create & Manage Fest',
    description: 'Spin up a multi-day, multi-venue fest in minutes. Full tenant isolation built in.',
    iconPath: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
  },
  {
    id: 2,
    stampNo: 'STAMP № B',
    denomination: '15¢',
    tag: 'DISPATCH',
    title: 'Event Management',
    description: 'Create events, set capacity, assign venues, schedule rounds — all from one dashboard.',
    iconPath: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4',
  },
  {
    id: 3,
    stampNo: 'STAMP № C',
    denomination: '25¢',
    tag: 'GATE INSPECTOR',
    title: 'QR Verification',
    description: 'Scan and validate participant QR codes in under a second. Works fully offline.',
    iconPath: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
  },
  {
    id: 4,
    stampNo: 'STAMP № D',
    denomination: '35¢',
    tag: 'HEATMAP',
    title: 'Live Crowd Heatmap',
    description: 'Real-time density visualization across all venues. Spot overcrowding before it happens.',
    iconPath: 'M3 3v18h18M7 16l4-8 4 4 4-6',
  },
  {
    id: 5,
    stampNo: 'STAMP № E',
    denomination: '20¢',
    tag: 'BROADCAST',
    title: 'Send Announcements',
    description: 'Push targeted alerts to all registrants, specific event groups, or the entire fest.',
    iconPath: 'M3 11l19-9-9 19-2-8-8-2z',
  },
  {
    id: 6,
    stampNo: 'STAMP № F',
    denomination: '50¢',
    tag: 'CLEARANCE',
    title: 'Access Control',
    description: 'Role-based permissions. Assign volunteers, gate staff, and co-organizers individually.',
    iconPath: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4',
  },
];

/* ─── Dashboard mock stats ─── */
export const DASHBOARD_STATS: DashboardStat[] = [
  { label: 'Registrations', value: '4,821', subtext: '+128 today' },
  { label: 'Live Check-ins', value: '1,039', subtext: 'Gate A: 412 · Gate B: 627' },
  { label: 'Active Events', value: '7 / 24', subtext: '3 starting next hour' },
];

/* ─── Stats strip ─── */
export const STATS: StatStrip[] = [
  { value: 5000,  suffix: '+',  label: 'Registrations', duration: 2000 },
  { value: 24,    suffix: '',   label: 'Events',         duration: 1000 },
  { value: 15,    suffix: '+',  label: 'Colleges',       duration: 1200 },
];
