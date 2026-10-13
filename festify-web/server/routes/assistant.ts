import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { assistantLimiter } from '../middleware/rateLimit.js';
import { getLLMClient } from '../assistant/client.js';
import { runAssistantConversation } from '../assistant/orchestrator.js';
import { executeTool } from '../assistant/tools.js';

const router = Router();
const prisma = new PrismaClient();

// Maximum character length for a single user prompt
const MAX_PROMPT_LENGTH = 4000;
// Maximum past messages allowed in conversation history array
const MAX_HISTORY_MESSAGES = 10;

// POST /api/assistant/chat
// Main conversational AI endpoint with role-scoped tools & tenant isolation
router.post('/chat', authenticateJWT, assistantLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const body = req.body || {};

    let userMessage = '';
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (body.message && typeof body.message === 'string') {
      userMessage = body.message.trim();
    } else if (Array.isArray(body.messages) && body.messages.length > 0) {
      const msgs = body.messages.slice(-MAX_HISTORY_MESSAGES);
      const last = msgs[msgs.length - 1];
      if (last.role === 'user' && typeof last.content === 'string') {
        userMessage = last.content.trim();
        conversationHistory = msgs.slice(0, -1).map((m: any) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: String(m.content || '').slice(0, MAX_PROMPT_LENGTH),
        }));
      }
    }

    if (!userMessage) {
      return res.status(400).json({ error: 'A non-empty user prompt is required.' });
    }

    if (userMessage.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        error: `Prompt exceeds maximum allowed length of ${MAX_PROMPT_LENGTH} characters.`,
      });
    }

    // Resolve festId strictly server-side
    let festId = 1;
    if (user.role === 'ADMIN') {
      const ownedFest = await prisma.fest.findFirst({
        where: { ownerId: user.id },
      });
      festId = ownedFest ? ownedFest.id : user.id;
    } else {
      const requestedFestId = Number(req.headers['x-fest-id'] || req.query.festId);
      if (requestedFestId && !isNaN(requestedFestId)) {
        festId = requestedFestId;
      } else {
        const defaultFest = await prisma.fest.findFirst();
        festId = defaultFest ? defaultFest.id : 1;
      }
    }

    const client = getLLMClient();
    const context = {
      userId: user.id,
      role: user.role,
      festId,
      prisma,
    };

    const result = await runAssistantConversation({
      client,
      context,
      userMessage,
      conversationHistory,
    });

    return res.json({
      reply: result.reply,
      response: result.reply, // Compatibility with UI
      toolCallsMade: result.toolCallsMade,
      iterations: result.iterations,
      usage: result.usage,
    });
  } catch (err: any) {
    console.error('[Assistant Chat Error]:', err);
    return res.status(500).json({
      error: err.message || 'An error occurred during AI processing.',
    });
  }
});

// POST /api/assistant/draft-event
// Organizer helper endpoint for "Generate with AI" button in event modal
router.post(
  '/draft-event',
  authenticateJWT,
  requireAdmin,
  assistantLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const { bullet_points, bullets, target_audience } = req.body || {};
      const notes = bullet_points || bullets || '';

      if (!notes || typeof notes !== 'string') {
        return res.status(400).json({ error: 'Organizer notes or bullet points are required.' });
      }

      if (notes.length > MAX_PROMPT_LENGTH) {
        return res.status(400).json({ error: 'Input is too long.' });
      }

      const context = {
        userId: user.id,
        role: user.role,
        festId: user.id,
        prisma,
      };

      const result = await executeTool(
        'draft_event_description',
        { bullet_points: notes, target_audience },
        context
      );

      return res.json(result);
    } catch (err: any) {
      console.error('[Assistant Draft Event Error]:', err);
      return res.status(500).json({ error: 'Failed to generate event draft.' });
    }
  }
);

// POST /api/assistant/draft-announcement
// Organizer helper endpoint for drafting broadcast alerts
router.post(
  '/draft-announcement',
  authenticateJWT,
  requireAdmin,
  assistantLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const { eventId, update_type, key_details, details } = req.body || {};
      const notes = key_details || details || '';

      if (!notes || typeof notes !== 'string') {
        return res.status(400).json({ error: 'Key announcement details are required.' });
      }

      const context = {
        userId: user.id,
        role: user.role,
        festId: user.id,
        prisma,
      };

      const result = await executeTool(
        'draft_announcement',
        {
          eventId: eventId ? Number(eventId) : undefined,
          update_type: update_type || 'general',
          key_details: notes,
        },
        context
      );

      return res.json(result);
    } catch (err: any) {
      console.error('[Assistant Draft Announcement Error]:', err);
      return res.status(500).json({ error: 'Failed to draft announcement.' });
    }
  }
);

export default router;
