import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireAdmin, AuthRequest } from '../middleware/auth.js';

import { broadcastNotification } from '../socket.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/notifications
 * Admin-only: Dispatch a fest-wide or event-targeted alert.
 */
router.post('/notifications', authenticateJWT, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { message, targetType = 'fest', targetEventId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (targetType !== 'fest' && targetType !== 'event') {
      return res.status(400).json({ error: 'targetType must be "fest" or "event"' });
    }

    let parsedEventId: number | null = null;
    if (targetType === 'event') {
      if (!targetEventId) {
        return res.status(400).json({ error: 'targetEventId is required when targetType is "event"' });
      }
      parsedEventId = Number(targetEventId);
      const targetEvent = await prisma.event.findUnique({ where: { id: parsedEventId } });

      if (!targetEvent) {
        return res.status(404).json({ error: 'Target event not found' });
      }

      // Tenant Security Check: Admin can only dispatch targeted notifications for their own events
      if (targetEvent.createdById !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden: You do not own the target event' });
      }
    }

    // Default festId is admin's user ID / fest ownership ID
    const festId = req.user!.id;

    const notification = await prisma.notification.create({
      data: {
        festId,
        message: message.trim(),
        targetType,
        targetEventId: parsedEventId,
      },
      include: {
        targetEvent: true,
      },
    });

    broadcastNotification(festId, notification);

    res.status(201).json(notification);
  } catch (error) {
    console.error('Notification creation error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

/**
 * GET /api/notifications
 * Authenticated users: Fetch notifications.
 * Targeted notifications (targetType === 'event') are only visible to registrants of that event.
 */
router.get('/notifications', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role === 'ADMIN') {
      // Admins see all notifications dispatched under their festId
      const notifications = await prisma.notification.findMany({
        where: { festId: user.id },
        include: { targetEvent: true },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(notifications);
    }

    // Student user: Get event IDs the student is registered for
    const userRegistrations = await prisma.registration.findMany({
      where: { userId: user.id, status: { not: 'CANCELLED' } },
      select: { eventId: true },
    });
    const registeredEventIds = userRegistrations.map((r) => r.eventId);

    // Fetch fest-wide notifications OR targeted notifications for events the student registered for
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetType: 'fest' },
          {
            targetType: 'event',
            targetEventId: { in: registeredEventIds.length > 0 ? registeredEventIds : [-1] },
          },
        ],
      },
      include: { targetEvent: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

export default router;
