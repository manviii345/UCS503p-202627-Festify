import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { authenticateJWT, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

async function formatEventWithCapacity(event: any) {
  const registeredCount = await prisma.registration.count({
    where: { eventId: event.id, status: { not: 'CANCELLED' } }
  });
  const remainingSeats = Math.max(0, event.maxParticipants - registeredCount);
  return {
    ...event,
    registeredCount,
    remainingSeats,
  };
}

router.get('/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
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
      orderBy: { date: 'asc' }
    });
    const withCapacity = await Promise.all(events.map(formatEventWithCapacity));
    res.json(withCapacity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST new event (Admin only)
router.post('/admin/events', authenticateJWT, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      name, description, image, category, date, startTime,
      endTime, venue, maxParticipants, registrationDeadline,
      rules, prizes, contact
    } = req.body;

    const event = await prisma.event.create({
      data: {
        name, description, image, category, date, startTime,
        endTime, venue, maxParticipants: Number(maxParticipants),
        registrationDeadline, rules, prizes, contact,
        createdById: req.user!.id
      }
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
    const updates = req.body;

    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Tenant Isolation Check: Admin can only edit their own fest's events
    if (existing.createdById !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this event' });
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updates
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

    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Tenant Isolation Check: Admin can only delete their own fest's events
    if (existing.createdById !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this event' });
    }

    await prisma.event.delete({ where: { id: eventId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

/**
 * POST /api/events/:eventId/register
 * Student event registration endpoint.
 * Atomically checks event capacity and creates registration inside a single database transaction.
 * Generates signed QR token encoding { userId, eventId, registrationId, issuedAt }.
 */
router.post('/events/:eventId/register', authenticateJWT, async (req: AuthRequest, res) => {
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
        include: { event: true }
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

/**
 * GET /api/registrations/my
 * Returns student's active registrations with event details.
 */
router.get('/registrations/my', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const registrations = await prisma.registration.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user registrations' });
  }
});

/**
 * POST /api/registrations/:registrationId/checkin
 * Gate check-in endpoint: verifies QR token signature and marks registration checked in.
 * Body can optionally supply { qrToken } or pass registrationId in URL.
 */
router.post('/registrations/:registrationId/checkin', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const registrationId = Number(req.params.registrationId);
    const { qrToken } = req.body;

    const reg = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true, user: true }
    });

    if (!reg) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const tokenToVerify = qrToken || reg.qrToken;

    try {
      const decoded = jwt.verify(tokenToVerify, JWT_SECRET) as any;
      if (decoded.registrationId !== reg.id) {
        return res.status(400).json({ error: 'Invalid QR token payload mismatch' });
      }
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or forged QR token signature' });
    }

    if (reg.status === 'CHECKED_IN') {
      return res.status(400).json({ error: 'Pass already checked in', checkedInAt: reg.checkedInAt });
    }

    const updated = await prisma.registration.update({
      where: { id: reg.id },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date()
      },
      include: { event: true, user: true }
    });

    res.json({
      success: true,
      message: 'Check-in successful! Pass validated.',
      registration: updated
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Check-in processing failed' });
  }
});

export default router;

