import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { broadcastDensityUpdate } from '../socket.js';

const router = Router();
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/fests/:festId/density
// Real-time crowd density: check-ins per zone for the given admin (tenantId).
// Public — no auth required (read-only telemetry).
// festId here = admin User.id (the tenant key used throughout the app).
// ─────────────────────────────────────────────────────────────────────────────
router.get('/fests/:festId/density', async (req, res) => {
  try {
    const adminId = Number(req.params.festId);
    if (isNaN(adminId)) return res.status(400).json({ error: 'Invalid festId' });

    // Group gate logs by zone for this admin's events
    const rows = await prisma.gateLog.groupBy({
      by: ['zoneId'],
      where: { adminId },
      _count: { id: true },
    });

    // Fetch zone metadata
    const zoneIds = rows.map((r) => r.zoneId).filter(Boolean) as number[];
    const zones = await prisma.venueZone.findMany({
      where: { id: { in: zoneIds } },
      select: { id: true, name: true, category: true, color: true },
    });
    const zoneMap = Object.fromEntries(zones.map((z) => [z.id, z]));

    // Total checked-in attendees for this admin's events
    const totalCheckedIn = await prisma.registration.count({
      where: {
        status: 'CHECKED_IN',
        event: { createdById: adminId },
      },
    });

    const densityByZone = rows.map((r) => ({
      zoneId: r.zoneId,
      zone: r.zoneId ? zoneMap[r.zoneId] ?? null : null,
      count: r._count.id,
    }));

    res.json({ festId: adminId, totalCheckedIn, densityByZone });
  } catch (error) {
    console.error('Density fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch crowd density' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/fests/:festId/density/history/:zoneId
// Last 100 crowd snapshots for a specific zone.
// Requires admin auth — admin can only see their own data.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/fests/:festId/density/history/:zoneId',
  authenticateJWT,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const adminId = Number(req.params.festId);
      const zoneId = Number(req.params.zoneId);
      if (isNaN(adminId) || isNaN(zoneId))
        return res.status(400).json({ error: 'Invalid festId or zoneId' });

      // Tenant isolation: admin can only query their own data
      if (req.user!.id !== adminId)
        return res.status(403).json({ error: 'Forbidden: Cross-tenant access rejected' });

      const snapshots = await prisma.crowdSnapshot.findMany({
        where: { adminId, zoneId },
        orderBy: { takenAt: 'desc' },
        take: 100,
      });

      res.json({ festId: adminId, zoneId, snapshots: snapshots.reverse() });
    } catch (error) {
      console.error('Density history error:', error);
      res.status(500).json({ error: 'Failed to fetch density history' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/fests/:festId/density/snapshot
// Admin triggers a manual crowd snapshot (records current density to history).
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/fests/:festId/density/snapshot',
  authenticateJWT,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const adminId = Number(req.params.festId);
      if (isNaN(adminId)) return res.status(400).json({ error: 'Invalid festId' });
      if (req.user!.id !== adminId)
        return res.status(403).json({ error: 'Forbidden: Cross-tenant access rejected' });

      // Aggregate current count by zone for this admin
      const rows = await prisma.gateLog.groupBy({
        by: ['zoneId'],
        where: { adminId },
        _count: { id: true },
      });

      const snapshots = await Promise.all(
        rows.map((r) =>
          prisma.crowdSnapshot.create({
            data: {
              adminId,
              zoneId: r.zoneId,
              count: r._count.id,
            },
          })
        )
      );

      res.status(201).json({ created: snapshots.length, snapshots });
    } catch (error) {
      console.error('Snapshot error:', error);
      res.status(500).json({ error: 'Failed to create crowd snapshot' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper: create a GateLog after a successful check-in.
// Called from events.ts processCheckIn — not an HTTP route.
// Non-fatal: errors are caught and logged without interrupting check-in flow.
// ─────────────────────────────────────────────────────────────────────────────
export async function recordGateLog(params: {
  registrationId: number;
  festId: number;      // = event.createdById (tenantId / adminId)
  eventId: number;
  zoneId: number | null;
}): Promise<void> {
  try {
    await prisma.gateLog.create({
      data: {
        registrationId: params.registrationId,
        adminId: params.festId,
        eventId: params.eventId,
        zoneId: params.zoneId ?? null,
      },
    });

    // Compute current zone count and broadcast to admin's Socket.IO room
    const zoneCount = await prisma.gateLog.count({
      where: { adminId: params.festId, zoneId: params.zoneId ?? null },
    });

    broadcastDensityUpdate(params.festId, {
      zoneId: params.zoneId,
      count: zoneCount,
      eventId: params.eventId,
      at: new Date().toISOString(),
    });
  } catch (err) {
    // Non-fatal: telemetry failure should not block the check-in response
    console.error('GateLog record error:', err);
  }
}

export default router;
