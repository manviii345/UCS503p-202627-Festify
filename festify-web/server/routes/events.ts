import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { authenticateJWT, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { registrationLimiter, checkinLimiter } from '../middleware/rateLimit.js';
import { broadcastCheckIn, broadcastScheduleUpdate } from '../socket.js';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Helper to attach io if initialized later (Phase 2)
let ioInstance: any = null;
export function setIoInstance(io: any) {
  ioInstance = io;
}

async function formatEventWithCapacity(event: any) {
  const registeredCount = await prisma.registration.count({
    where: { eventId: event.id, status: { not: 'CANCELLED' } }
  });
  const checkedInCount = await prisma.registration.count({
    where: { eventId: event.id, status: 'CHECKED_IN' }
  });
  const remainingSeats = Math.max(0, event.maxParticipants - registeredCount);
  const fillRate = event.maxParticipants > 0 
    ? Math.round((registeredCount / event.maxParticipants) * 100) 
    : 0;

  return {
    ...event,
    registeredCount,
    checkedInCount,
    remainingSeats,
    fillRate,
  };
}

// GET all public events (with zone relation)
router.get('/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: { zone: true },
      orderBy: { date: 'asc' }
    });
    const withCapacity = await Promise.all(events.map(formatEventWithCapacity));
    res.json(withCapacity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET tenant-scoped events for a specific festId (admin user id)
router.get('/fests/:festId/events', async (req, res) => {
  try {
    const festId = Number(req.params.festId);
    if (isNaN(festId)) return res.status(400).json({ error: 'Invalid festId' });

    const events = await prisma.event.findMany({
      where: { createdById: festId },
      include: { zone: true },
      orderBy: { date: 'asc' }
    });
    const withCapacity = await Promise.all(events.map(formatEventWithCapacity));
    res.json(withCapacity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fest events' });
  }
});

// GET admin's events (admin only)
router.get('/admin/events', authenticateJWT, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { createdById: req.user?.id },
      include: { zone: true },
      orderBy: { date: 'asc' }
    });
    const withCapacity = await Promise.all(events.map(formatEventWithCapacity));
    res.json(withCapacity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET admin dashboard stats (tenant-scoped real queries)
router.get('/admin/stats', authenticateJWT, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const adminId = req.user!.id;
    const adminEvents = await prisma.event.findMany({
      where: { createdById: adminId },
      include: { zone: true },
      orderBy: { date: 'asc' }
    });

    const eventIds = adminEvents.map(e => e.id);

    const totalRegistrations = await prisma.registration.count({
      where: { eventId: { in: eventIds }, status: { not: 'CANCELLED' } }
    });

    const totalCheckedIn = await prisma.registration.count({
      where: { eventId: { in: eventIds }, status: 'CHECKED_IN' }
    });

    const totalSeats = adminEvents.reduce((acc, e) => acc + e.maxParticipants, 0);
    const overallFillRate = totalSeats > 0 ? Math.round((totalRegistrations / totalSeats) * 100) : 0;

    const formattedEvents = await Promise.all(adminEvents.map(formatEventWithCapacity));

    const recentRegistrations = await prisma.registration.findMany({
      where: { eventId: { in: eventIds } },
      include: {
        user: { select: { id: true, username: true } },
        event: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      totalRegistrations,
      totalCheckedIn,
      totalEvents: adminEvents.length,
      totalSeats,
      overallFillRate,
      events: formattedEvents,
      recentRegistrations: recentRegistrations.map(r => ({
        id: r.id,
        name: r.user.username,
        event: r.event.name,
        status: r.status,
        date: r.createdAt.toLocaleDateString(),
        checkedInAt: r.checkedInAt
      }))
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin dashboard statistics' });
  }
});

// POST new event (Admin only with input validation & optional zoneId)
router.post('/admin/events', authenticateJWT, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      name, description, image, category, date, startTime,
      endTime, venue, maxParticipants, registrationDeadline,
      rules, prizes, contact, zoneId
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Event name is required' });
    }
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Event description is required' });
    }
    if (!maxParticipants || isNaN(Number(maxParticipants)) || Number(maxParticipants) <= 0) {
      return res.status(400).json({ error: 'Valid maxParticipants is required' });
    }

    let parsedZoneId: number | null = null;
    if (zoneId !== undefined && zoneId !== null && zoneId !== '') {
      parsedZoneId = Number(zoneId);
      if (isNaN(parsedZoneId)) {
        return res.status(400).json({ error: 'Invalid zoneId' });
      }
      const zoneExists = await prisma.venueZone.findUnique({ where: { id: parsedZoneId } });
      if (!zoneExists) {
        return res.status(404).json({ error: 'Referenced venue zone not found' });
      }
    }

    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        image: image || null,
        category: category || 'General',
        date: date || new Date().toISOString().split('T')[0],
        startTime: startTime || '10:00 AM',
        endTime: endTime || '05:00 PM',
        venue: venue || 'Main Campus',
        maxParticipants: Number(maxParticipants),
        registrationDeadline: registrationDeadline || date || '2026-12-31',
        rules: rules || null,
        prizes: prizes || null,
        contact: contact || null,
        zoneId: parsedZoneId,
        createdById: req.user!.id
      },
      include: { zone: true }
    });

    const formatted = await formatEventWithCapacity(event);
    res.status(201).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT update event (Admin only — Tenant Ownership Enforced)
router.put('/admin/events/:id', authenticateJWT, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) return res.status(400).json({ error: 'Invalid eventId' });

    const updates = req.body;

    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Tenant Isolation Check: Admin can only edit their own fest's events
    if (existing.createdById !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this event' });
    }

    if (updates.zoneId !== undefined && updates.zoneId !== null && updates.zoneId !== '') {
      updates.zoneId = Number(updates.zoneId);
      if (isNaN(updates.zoneId)) {
        return res.status(400).json({ error: 'Invalid zoneId' });
      }
      const zone = await prisma.venueZone.findUnique({ where: { id: updates.zoneId } });
      if (!zone) return res.status(404).json({ error: 'Referenced zone not found' });
    }

    if (updates.maxParticipants !== undefined) {
      updates.maxParticipants = Number(updates.maxParticipants);
      if (isNaN(updates.maxParticipants) || updates.maxParticipants <= 0) {
        return res.status(400).json({ error: 'Invalid maxParticipants value' });
      }
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updates,
      include: { zone: true }
    });

    const formatted = await formatEventWithCapacity(event);
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE event (Admin only — Tenant Ownership Enforced)
router.delete('/admin/events/:id', authenticateJWT, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) return res.status(400).json({ error: 'Invalid eventId' });

    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (existing.createdById !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this event' });
    }

    await prisma.event.delete({ where: { id: eventId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// POST Student event registration (with rate limiting & atomic transaction)
router.post('/events/:eventId/register', authenticateJWT, registrationLimiter, async (req: AuthRequest, res) => {
  const eventId = Number(req.params.eventId);
  const userId = req.user!.id;

  if (isNaN(eventId)) {
    return res.status(400).json({ error: 'Invalid eventId' });
  }

  try {
    const registration = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) {
        throw { status: 404, message: 'Event not found' };
      }

      const activeCount = await tx.registration.count({
        where: { eventId, status: { not: 'CANCELLED' } }
      });

      if (activeCount >= event.maxParticipants) {
        throw { status: 400, message: 'Event is full' };
      }

      const existing = await tx.registration.findUnique({
        where: { userId_eventId: { userId, eventId } }
      });
      if (existing && existing.status !== 'CANCELLED') {
        throw { status: 400, message: 'Already registered for this event' };
      }

      const issuedAt = Date.now();

      const tempToken = `temp_${userId}_${eventId}_${issuedAt}`;
      const reg = await tx.registration.create({
        data: {
          userId,
          eventId,
          qrToken: tempToken,
          status: 'REGISTERED'
        }
      });

      const signedQrToken = jwt.sign(
        { userId, eventId, registrationId: reg.id, issuedAt },
        JWT_SECRET
      );

      const finalReg = await tx.registration.update({
        where: { id: reg.id },
        data: { qrToken: signedQrToken },
        include: { event: { include: { zone: true } } }
      });

      return finalReg;
    });

    res.status(201).json(registration);
  } catch (error: any) {
    if (error.status && error.message) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET student registrations
router.get('/registrations/my', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const registrations = await prisma.registration.findMany({
      where: { userId },
      include: { event: { include: { zone: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user registrations' });
  }
});

// Check-in helper logic
async function processCheckIn(registrationId: number, tokenToVerify: string | undefined, reqUser: any) {
  let regIdToFind = registrationId;

  if (tokenToVerify) {
    try {
      const decoded = jwt.verify(tokenToVerify, JWT_SECRET) as any;
      if (decoded && decoded.registrationId) {
        regIdToFind = Number(decoded.registrationId);
      }
    } catch (err) {
      throw { status: 400, message: 'Invalid or forged QR token signature' };
    }
  }

  const reg = await prisma.registration.findUnique({
    where: { id: regIdToFind },
    include: { event: true, user: true }
  });

  if (!reg) {
    throw { status: 404, message: 'Registration not found' };
  }

  if (tokenToVerify) {
    try {
      const decoded = jwt.verify(tokenToVerify, JWT_SECRET) as any;
      if (decoded.registrationId !== reg.id) {
        throw { status: 400, message: 'Invalid QR token payload mismatch' };
      }
    } catch (err: any) {
      if (err.status) throw err;
      throw { status: 400, message: 'Invalid or forged QR token signature' };
    }
  }

  if (reg.status === 'CHECKED_IN') {
    throw { status: 400, message: 'Pass already checked in', checkedInAt: reg.checkedInAt };
  }

  const updated = await prisma.registration.update({
    where: { id: reg.id },
    data: {
      status: 'CHECKED_IN',
      checkedInAt: new Date()
    },
    include: { event: { include: { zone: true } }, user: true }
  });

  if (reg.event.createdById) {
    broadcastCheckIn(reg.event.createdById, {
      eventId: reg.eventId,
      eventName: reg.event.name,
      registrationId: reg.id,
      username: reg.user.username,
      checkedInAt: updated.checkedInAt
    });
  }

  return updated;
}

// POST direct token check-in (for camera QR scanner posting decoded JWT token)
router.post('/registrations/scan-checkin', authenticateJWT, checkinLimiter, async (req: AuthRequest, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken || typeof qrToken !== 'string') {
      return res.status(400).json({ error: 'qrToken is required' });
    }
    const updated = await processCheckIn(0, qrToken, req.user);
    res.json({
      success: true,
      message: 'Check-in successful! Pass validated.',
      registration: updated
    });
  } catch (error: any) {
    if (error.status && error.message) {
      return res.status(error.status).json({ error: error.message, ...(error.checkedInAt ? { checkedInAt: error.checkedInAt } : {}) });
    }
    res.status(500).json({ error: 'Check-in processing failed' });
  }
});

// POST registration check-in by ID or body qrToken
router.post('/registrations/:registrationId/checkin', authenticateJWT, checkinLimiter, async (req: AuthRequest, res) => {
  try {
    const registrationId = Number(req.params.registrationId);
    const { qrToken } = req.body;

    const updated = await processCheckIn(isNaN(registrationId) ? 0 : registrationId, qrToken, req.user);
    res.json({
      success: true,
      message: 'Check-in successful! Pass validated.',
      registration: updated
    });
  } catch (error: any) {
    if (error.status && error.message) {
      return res.status(error.status).json({ error: error.message, ...(error.checkedInAt ? { checkedInAt: error.checkedInAt } : {}) });
    }
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Check-in processing failed' });
  }
});

export default router;
