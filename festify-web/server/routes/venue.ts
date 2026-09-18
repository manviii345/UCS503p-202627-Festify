import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

function pointInPolygon(px: number, py: number, polygon: number[][]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

const DEFAULT_VENUE_ZONES = [
  { name: 'North Gate (Main Entry)', type: 'zone', category: 'gate', color: '#EC6484', icon: '🚪', description: 'Main entry gate. Show your QR pass here. Open 8 AM – 11 PM.', coordinates: [[420, 10], [580, 10], [580, 70], [420, 70]] },
  { name: 'South Gate (Exit Only)', type: 'zone', category: 'gate', color: '#EC6484', icon: '🚪', description: 'Exit-only gate. Emergency access available.', coordinates: [[400, 630], [600, 630], [600, 695], [400, 695]] },
  { name: 'East Gate (Parking Entry)', type: 'zone', category: 'gate', color: '#EC6484', icon: '🚪', description: 'Dedicated entry for vehicles. Connect to Parking Lot.', coordinates: [[920, 280], [995, 280], [995, 420], [920, 420]] },
  { name: 'Open Air Amphitheatre', type: 'zone', category: 'stage', color: '#F06E38', icon: '🎭', description: 'Main stage for Battle of Bands, cultural performances & DJ night. Capacity 800.', coordinates: [[80, 90], [460, 90], [460, 310], [80, 310]] },
  { name: 'Indoor Auditorium', type: 'zone', category: 'stage', color: '#F06E38', icon: '🎤', description: 'Air-conditioned auditorium for talks, stand-up comedy & classical dance. Capacity 400.', coordinates: [[540, 90], [880, 90], [880, 260], [540, 260]] },
  { name: 'Food Court A', type: 'zone', category: 'food', color: '#F4C430', icon: '🍕', description: 'Fast food, beverages & desserts. Stalls: Burger King, rolls, momos.', coordinates: [[80, 340], [320, 340], [320, 500], [80, 500]] },
  { name: 'Food Court B', type: 'zone', category: 'food', color: '#F4C430', icon: '🍜', description: 'South Indian, Chinese, and North Indian thalis. Vegetarian-friendly zone.', coordinates: [[350, 340], [590, 340], [590, 500], [350, 500]] },
  { name: 'Street Food Alley', type: 'zone', category: 'food', color: '#F4C430', icon: '🌮', description: 'Chaat, pani puri, corn, juice stalls. Open till 1 AM.', coordinates: [[620, 290], [880, 290], [880, 440], [620, 440]] },
  { name: 'Parking Lot', type: 'zone', category: 'parking', color: '#9CA3AF', icon: '🅿️', description: 'Two-wheeler and four-wheeler parking. Free for registered participants.', coordinates: [[700, 470], [920, 470], [920, 620], [700, 620]] },
  { name: 'Registration Desk', type: 'landmark', category: 'registration', color: '#6366F1', icon: '📋', description: 'Collect wristbands, QR passes & event kits here. Opens 7:30 AM.', coordinates: [240, 530] },
  { name: 'First Aid Centre', type: 'landmark', category: 'firstaid', color: '#EF4444', icon: '🏥', description: '24/7 medical assistance. Staffed by MBBS doctors & paramedics.', coordinates: [500, 530] },
  { name: 'Restrooms (Block A)', type: 'landmark', category: 'restroom', color: '#06B6D4', icon: '🚻', description: 'Clean restrooms with attendants. Near food courts.', coordinates: [160, 560] },
  { name: 'Restrooms (Block B)', type: 'landmark', category: 'restroom', color: '#06B6D4', icon: '🚻', description: 'Additional restroom block near auditorium.', coordinates: [760, 190] },
  { name: 'Info & Help Booth', type: 'landmark', category: 'other', color: '#8B5CF6', icon: 'ℹ️', description: 'Volunteers available to assist. Lost & found, schedule updates.', coordinates: [500, 360] },
];

/**
 * GET /api/fests/:festId/venue
 * Public. Returns all venue zones for the given fest (admin user id).
 * Response: { festId, zones: VenueZone[] } where coordinates is parsed back to array.
 */
router.get('/:festId/venue', async (req, res) => {
  const festId = Number(req.params.festId) || 1;

  try {
    let zones = await prisma.venueZone.findMany({
      where: { festId },
      orderBy: { createdAt: 'asc' },
    });

    if (zones.length === 0) {
      for (const z of DEFAULT_VENUE_ZONES) {
        await prisma.venueZone.create({
          data: {
            name: z.name,
            type: z.type,
            category: z.category,
            color: z.color,
            icon: z.icon,
            description: z.description,
            coordinates: JSON.stringify(z.coordinates),
            festId,
          },
        });
      }
      zones = await prisma.venueZone.findMany({
        where: { festId },
        orderBy: { createdAt: 'asc' },
      });
    }

    const parsed = zones.map((z) => ({
      ...z,
      coordinates: typeof z.coordinates === 'string' ? JSON.parse(z.coordinates) : z.coordinates,
    }));

    res.json({ festId, zones: parsed });
  } catch (error) {
    console.error('GET /venue error:', error);
    res.status(500).json({ error: 'Failed to fetch venue zones' });
  }
});

/**
 * POST /api/fests/:festId/venue/zones
 * Admin-only. Creates a new venue zone.
 * Enforces tenant isolation: the authenticated admin must own this festId (festId === req.user.id).
 *
 * Body: { name, type, category, coordinates, color?, description?, icon? }
 *   coordinates: number[][] for zones, [number, number] for landmarks
 */
router.post('/:festId/venue/zones', authenticateJWT, requireAdmin, async (req: AuthRequest, res) => {
  const festId = Number(req.params.festId);
  if (isNaN(festId)) {
    return res.status(400).json({ error: 'Invalid festId' });
  }

  if (req.user!.id !== festId) {
    return res.status(403).json({
      error: 'Forbidden: you can only manage zones for your own fest',
    });
  }

  const { name, type = 'zone', category = 'other', coordinates, color = '#F4C430', description, icon } = req.body;

  if (!name || !coordinates || !Array.isArray(coordinates)) {
    return res.status(400).json({ error: 'name and coordinates (array) are required' });
  }

  try {
    const zone = await prisma.venueZone.create({
      data: {
        name,
        type,
        category,
        coordinates: JSON.stringify(coordinates),
        color,
        description,
        icon,
        festId,
      },
    });

    res.status(201).json({ ...zone, coordinates: JSON.parse(zone.coordinates) });
  } catch (error) {
    console.error('POST /venue/zones error:', error);
    res.status(500).json({ error: 'Failed to create venue zone' });
  }
});

/**
 * POST /api/fests/:festId/venue/locate
 * Public. Accepts { x, y } and returns the first zone that contains the point.
 * Uses ray-casting for polygons; Euclidean distance (radius 30) for landmarks.
 *
 * Response: { zone } or { zone: null }
 */
router.post('/:festId/venue/locate', async (req, res) => {
  const festId = Number(req.params.festId);
  if (isNaN(festId)) {
    return res.status(400).json({ error: 'Invalid festId' });
  }

  const { x, y } = req.body;
  if (typeof x !== 'number' || typeof y !== 'number') {
    return res.status(400).json({ error: 'Body must include { x: number, y: number }' });
  }

  try {
    const zones = await prisma.venueZone.findMany({ where: { festId } });

    let matched: (typeof zones[number] & { coordinates: any }) | null = null;

    for (const z of zones) {
      const coords = JSON.parse(z.coordinates);

      if (z.type === 'landmark') {
        const [lx, ly] = coords as [number, number];
        const dist = Math.sqrt((x - lx) ** 2 + (y - ly) ** 2);
        if (dist <= 30) {
          matched = { ...z, coordinates: coords };
          break;
        }
      } else {
        if (pointInPolygon(x, y, coords as number[][])) {
          matched = { ...z, coordinates: coords };
          break;
        }
      }
    }

    res.json({ zone: matched });
  } catch (error) {
    console.error('POST /venue/locate error:', error);
    res.status(500).json({ error: 'Failed to locate zone' });
  }
});

export default router;
