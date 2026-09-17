import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const SALT_ROUNDS = 12

// ─── Venue Layout ────────────────────────────────────────────────────────────
// Coordinate space: 1000 × 700 px (SVG units), representing an IIT-style campus.
//
// Legend:
//  Gates  — at the campus perimeter edges
//  Stages — upper half (Amphitheatre open-air, Indoor Auditorium)
//  Food   — centre rows (Food Court A, B, Street Food Alley)
//  Landmarks — Registration, First Aid, Restrooms, Parking, Info Booth

const VENUE_ZONES = [
  // ── GATES (entry/exit points) ──────────────────────────────────────────
  {
    name: 'North Gate (Main Entry)',
    type: 'zone',
    category: 'gate',
    color: '#EC6484',
    icon: '🚪',
    description: 'Main entry gate. Show your QR pass here. Open 8 AM – 11 PM.',
    coordinates: [[420, 10], [580, 10], [580, 70], [420, 70]],
  },
  {
    name: 'South Gate (Exit Only)',
    type: 'zone',
    category: 'gate',
    color: '#EC6484',
    icon: '🚪',
    description: 'Exit-only gate. Emergency access available.',
    coordinates: [[400, 630], [600, 630], [600, 695], [400, 695]],
  },
  {
    name: 'East Gate (Parking Entry)',
    type: 'zone',
    category: 'gate',
    color: '#EC6484',
    icon: '🚪',
    description: 'Dedicated entry for vehicles. Connect to Parking Lot.',
    coordinates: [[920, 280], [995, 280], [995, 420], [920, 420]],
  },

  // ── STAGES (performance zones) ─────────────────────────────────────────
  {
    name: 'Open Air Amphitheatre',
    type: 'zone',
    category: 'stage',
    color: '#F06E38',
    icon: '🎭',
    description: 'Main stage for Battle of Bands, cultural performances & DJ night. Capacity 800.',
    coordinates: [[80, 90], [460, 90], [460, 310], [80, 310]],
  },
  {
    name: 'Indoor Auditorium',
    type: 'zone',
    category: 'stage',
    color: '#F06E38',
    icon: '🎤',
    description: 'Air-conditioned auditorium for talks, stand-up comedy & classical dance. Capacity 400.',
    coordinates: [[540, 90], [880, 90], [880, 260], [540, 260]],
  },

  // ── FOOD COURTS ────────────────────────────────────────────────────────
  {
    name: 'Food Court A',
    type: 'zone',
    category: 'food',
    color: '#F4C430',
    icon: '🍕',
    description: 'Fast food, beverages & desserts. Stalls: Burger King, rolls, momos.',
    coordinates: [[80, 340], [320, 340], [320, 500], [80, 500]],
  },
  {
    name: 'Food Court B',
    type: 'zone',
    category: 'food',
    color: '#F4C430',
    icon: '🍜',
    description: 'South Indian, Chinese, and North Indian thalis. Vegetarian-friendly zone.',
    coordinates: [[350, 340], [590, 340], [590, 500], [350, 500]],
  },
  {
    name: 'Street Food Alley',
    type: 'zone',
    category: 'food',
    color: '#F4C430',
    icon: '🌮',
    description: 'Chaat, pani puri, corn, juice stalls. Open till 1 AM.',
    coordinates: [[620, 290], [880, 290], [880, 440], [620, 440]],
  },

  // ── PARKING ────────────────────────────────────────────────────────────
  {
    name: 'Parking Lot',
    type: 'zone',
    category: 'parking',
    color: '#9CA3AF',
    icon: '🅿️',
    description: 'Two-wheeler and four-wheeler parking. Free for registered participants.',
    coordinates: [[700, 470], [920, 470], [920, 620], [700, 620]],
  },

  // ── LANDMARKS (point markers) ──────────────────────────────────────────
  {
    name: 'Registration Desk',
    type: 'landmark',
    category: 'registration',
    color: '#6366F1',
    icon: '📋',
    description: 'Collect wristbands, QR passes & event kits here. Opens 7:30 AM.',
    coordinates: [240, 530],
  },
  {
    name: 'First Aid Centre',
    type: 'landmark',
    category: 'firstaid',
    color: '#EF4444',
    icon: '🏥',
    description: '24/7 medical assistance. Staffed by MBBS doctors & paramedics.',
    coordinates: [500, 530],
  },
  {
    name: 'Restrooms (Block A)',
    type: 'landmark',
    category: 'restroom',
    color: '#06B6D4',
    icon: '🚻',
    description: 'Clean restrooms with attendants. Near food courts.',
    coordinates: [160, 560],
  },
  {
    name: 'Restrooms (Block B)',
    type: 'landmark',
    category: 'restroom',
    color: '#06B6D4',
    icon: '🚻',
    description: 'Additional restroom block near auditorium.',
    coordinates: [760, 190],
  },
  {
    name: 'Info & Help Booth',
    type: 'landmark',
    category: 'other',
    color: '#8B5CF6',
    icon: 'ℹ️',
    description: 'Volunteers available to assist. Lost & found, schedule updates.',
    coordinates: [500, 360],
  },
]

async function main() {
  // ── Users ───────────────────────────────────────────────────────────────
  const adminHashedPassword = await bcrypt.hash('password', SALT_ROUNDS)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: adminHashedPassword },
    create: {
      username: 'admin',
      password: adminHashedPassword,
      role: 'ADMIN',
    },
  })
  console.log('Created/Updated Admin:', admin.username)

  const studentHashedPassword = await bcrypt.hash('password', SALT_ROUNDS)
  const student = await prisma.user.upsert({
    where: { username: 'student' },
    update: { password: studentHashedPassword },
    create: {
      username: 'student',
      password: studentHashedPassword,
      role: 'STUDENT',
    },
  })
  console.log('Created/Updated Student:', student.username)

  // ── Fest Entity ─────────────────────────────────────────────────────────
  const fest = await prisma.fest.upsert({
    where: { id: 1 },
    update: {
      name: 'Aurora Fest 2026',
      startDate: '2026-11-14',
      endDate: '2026-11-16',
      branding: 'aurora_2026_theme',
      ownerId: admin.id,
    },
    create: {
      id: 1,
      name: 'Aurora Fest 2026',
      startDate: '2026-11-14',
      endDate: '2026-11-16',
      branding: 'aurora_2026_theme',
      ownerId: admin.id,
    },
  });
  console.log('Created/Updated Fest Entity:', fest);

  // ── Events ──────────────────────────────────────────────────────────────
  const event1 = await prisma.event.create({
    data: {
      name: 'Hacklipse 2026',
      description: 'A 24-hour coding marathon to build amazing things.',
      category: 'Hackathon',
      date: '2026-11-15',
      startTime: '09:00 AM',
      endTime: '09:00 AM',
      venue: 'CS Department, Lab 3',
      maxParticipants: 200,
      registrationDeadline: '2026-11-10',
      status: 'Upcoming',
      createdById: admin.id,
      festId: fest.id,
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80',
    }
  })

  const event2 = await prisma.event.create({
    data: {
      name: 'Battle of Bands',
      description: 'The ultimate music showdown between the best college bands.',
      category: 'Cultural',
      date: '2026-11-14',
      startTime: '06:00 PM',
      endTime: '11:00 PM',
      venue: 'Open Air Amphitheatre',
      maxParticipants: 800,
      registrationDeadline: '2026-11-12',
      status: 'Live',
      createdById: admin.id,
      festId: fest.id,
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
    }
  })
  console.log('Seeded Events:', event1.name, event2.name)

  // ── Venue Zones ────────────────────────────────────────────────────────
  await prisma.venueZone.deleteMany({ where: { festId: fest.id } })

  for (const zone of VENUE_ZONES) {
    await prisma.venueZone.create({
      data: {
        name: zone.name,
        type: zone.type,
        category: zone.category,
        color: zone.color,
        icon: zone.icon,
        description: zone.description,
        coordinates: JSON.stringify(zone.coordinates),
        festId: fest.id,
      },
    })
  }
  console.log(`Seeded ${VENUE_ZONES.length} venue zones for festId=${fest.id} (owner=${admin.id})`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

