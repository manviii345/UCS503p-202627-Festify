import { PrismaClient } from '@prisma/client';
import { LLMToolDefinition } from './client.js';

export interface ToolContext {
  userId: number;
  role: 'STUDENT' | 'ADMIN';
  festId: number;
  prisma: PrismaClient;
}

// ----------------------------------------------------
// Tool Definitions (Role-Scoped Schemas)
// ----------------------------------------------------

export const STUDENT_TOOL_DEFINITIONS: LLMToolDefinition[] = [
  {
    name: 'list_events',
    description: 'List upcoming festival events with optional filtering by category, date, or seat availability.',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter events by category (e.g., Workshop, Competition, Cultural, Tech, Gaming)',
        },
        date: {
          type: 'string',
          description: 'Filter events by date in YYYY-MM-DD format',
        },
        has_seats: {
          type: 'boolean',
          description: 'If true, only returns events that still have remaining seats available',
        },
      },
    },
  },
  {
    name: 'search_events',
    description: 'Search festival events by keyword in title, description, or tags.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query or keyword',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_my_registrations',
    description: "Retrieve the current logged-in student's event registrations, passes, and check-in statuses.",
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Optional filter: REGISTERED, CHECKED_IN, or CANCELLED',
        },
      },
    },
  },
  {
    name: 'locate_zone',
    description: 'Find a venue zone, stage, or landmark on the campus map by name and list events taking place there.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the zone or stage (e.g., "Auditorium", "Main Ground", "Tech Arena")',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'plan_my_day',
    description: 'Generate a non-overlapping recommended festival schedule based on user registrations and open popular events.',
    input_schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Specific date to plan for in YYYY-MM-DD format (optional)',
        },
      },
    },
  },
];

export const ADMIN_TOOL_DEFINITIONS: LLMToolDefinition[] = [
  {
    name: 'get_my_events_stats',
    description: "Get real-time registration, capacity, and check-in attendance stats for the admin's owned events.",
    input_schema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'number',
          description: 'Specific event ID to inspect. If omitted, returns an overview of all events created by you.',
        },
      },
    },
  },
  {
    name: 'list_registrations_for_event',
    description: 'List attendee registrations for an event owned by you with check-in status and timestamps.',
    input_schema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'number',
          description: 'The event ID to view attendees for (must be owned by you)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        pageSize: {
          type: 'number',
          description: 'Number of attendees per page (default: 20)',
        },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'draft_event_description',
    description: 'Generate a polished, compelling event title, description, category, and capacity from rough organizer notes.',
    input_schema: {
      type: 'object',
      properties: {
        bullet_points: {
          type: 'string',
          description: 'Organizer notes or bullet points about the proposed event',
        },
        target_audience: {
          type: 'string',
          description: 'Target audience (e.g., beginners, coders, gamers, all campus)',
        },
      },
      required: ['bullet_points'],
    },
  },
  {
    name: 'draft_announcement',
    description: 'Draft a concise, high-urgency festival notification or event update for students.',
    input_schema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'number',
          description: 'Optional event ID this announcement targets',
        },
        update_type: {
          type: 'string',
          description: 'Type of update: "venue_change", "delay", "reminder", "general"',
        },
        key_details: {
          type: 'string',
          description: 'Key details to announce (e.g. "Moved to Hall B due to rain")',
        },
      },
      required: ['update_type', 'key_details'],
    },
  },
];

// Helper: Wrap untrusted text in safety delimiters
export function sanitizeOrganizerText(text: string): string {
  if (!text) return '';
  return `<user_content>\n${text.replace(/<\/?user_content>/gi, '')}\n</user_content>`;
}

// ----------------------------------------------------
// Tool Executors (Strict Server-Side Tenant Context)
// ----------------------------------------------------

export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  context: ToolContext
): Promise<any> {
  const { userId, role, festId, prisma } = context;

  // Enforce role isolation: Student cannot execute Admin tools
  const adminToolNames = ADMIN_TOOL_DEFINITIONS.map((t) => t.name);
  if (role === 'STUDENT' && adminToolNames.includes(toolName)) {
    return {
      error: `Security Violation: Student role is not permitted to execute organizer tool '${toolName}'.`,
    };
  }

  switch (toolName) {
    // ------------------------------------------------
    // STUDENT TOOLS
    // ------------------------------------------------
    case 'list_events': {
      const whereClause: any = {};
      if (festId) {
        whereClause.festId = festId;
      }
      if (args.category) {
        whereClause.category = { contains: args.category };
      }
      if (args.date) {
        whereClause.date = args.date;
      }

      const events = await prisma.event.findMany({
        where: whereClause,
        include: {
          zone: true,
          _count: {
            select: {
              registrations: {
                where: { status: { not: 'CANCELLED' } },
              },
            },
          },
        },
        orderBy: { id: 'asc' },
        take: 25,
      });

      const formatted = events
        .map((e) => {
          const registeredCount = e._count.registrations;
          const remainingSeats = Math.max(0, e.maxParticipants - registeredCount);
          return {
            id: e.id,
            title: e.name,
            name: e.name,
            category: e.category,
            date: e.date,
            startTime: e.startTime,
            endTime: e.endTime,
            venue: e.venue,
            maxParticipants: e.maxParticipants,
            registeredCount,
            remainingSeats,
            zone: e.zone ? { name: e.zone.name, category: e.zone.category } : null,
          };
        })
        .filter((e) => (args.has_seats ? e.remainingSeats > 0 : true));

      return {
        total: formatted.length,
        events: formatted,
      };
    }

    case 'search_events': {
      const q = (args.query || '').trim();
      if (!q) {
        return { events: [], message: 'Please provide a search term.' };
      }

      const events = await prisma.event.findMany({
        where: {
          festId: festId || undefined,
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
            { category: { contains: q } },
          ],
        },
        include: {
          zone: true,
          _count: {
            select: {
              registrations: { where: { status: { not: 'CANCELLED' } } },
            },
          },
        },
        take: 10,
      });

      return {
        query: q,
        matches: events.map((e) => ({
          id: e.id,
          title: e.name,
          name: e.name,
          category: e.category,
          date: e.date,
          startTime: e.startTime,
          remainingSeats: Math.max(0, e.maxParticipants - e._count.registrations),
          zone: e.zone?.name || e.venue || 'Campus',
        })),
      };
    }

    case 'get_my_registrations': {
      const regs = await prisma.registration.findMany({
        where: {
          userId,
          status: args.status ? args.status : undefined,
        },
        include: {
          event: {
            include: { zone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        userId,
        count: regs.length,
        passes: regs.map((r) => ({
          registrationId: r.id,
          status: r.status,
          registeredAt: r.createdAt,
          createdAt: r.createdAt,
          event: {
            id: r.event.id,
            title: r.event.name,
            name: r.event.name,
            date: r.event.date,
            startTime: r.event.startTime,
            endTime: r.event.endTime,
            venue: r.event.venue,
            zone: r.event.zone ? `${r.event.zone.name} (${r.event.zone.category || 'Stage'})` : r.event.venue,
          },
        })),
      };
    }

    case 'locate_zone': {
      const name = (args.name || '').trim();
      const zone = await prisma.venueZone.findFirst({
        where: {
          festId: festId || undefined,
          name: { contains: name },
        },
        include: {
          events: {
            orderBy: { id: 'asc' },
            take: 5,
          },
        },
      });

      if (!zone) {
        return {
          found: false,
          message: `No venue zone matching "${name}" was found. Please check campus map.`,
        };
      }

      return {
        found: true,
        zone: {
          id: zone.id,
          name: zone.name,
          category: zone.category,
          description: zone.description,
          coordinates: zone.coordinates,
          upcomingEvents: zone.events.map((e) => ({
            id: e.id,
            title: e.name,
            name: e.name,
            date: e.date,
            time: `${e.startTime} - ${e.endTime}`,
          })),
        },
      };
    }

    case 'plan_my_day': {
      // 1. Fetch user's registered events
      const registered = await prisma.registration.findMany({
        where: { userId, status: { not: 'CANCELLED' } },
        include: { event: { include: { zone: true } } },
      });

      // 2. Fetch other upcoming events with remaining seats
      const otherEvents = await prisma.event.findMany({
        where: {
          festId: festId || undefined,
          id: { notIn: registered.map((r) => r.eventId) },
        },
        include: {
          zone: true,
          _count: {
            select: { registrations: { where: { status: { not: 'CANCELLED' } } } },
          },
        },
        take: 10,
      });

      // Filter other events for available seats
      const availableOther = otherEvents.filter(
        (e) => Math.max(0, e.maxParticipants - e._count.registrations) > 0
      );

      const timeline = [
        ...registered.map((r) => ({
          type: 'REGISTERED' as const,
          eventId: r.event.id,
          title: r.event.name,
          name: r.event.name,
          category: r.event.category,
          date: r.event.date,
          startTime: r.event.startTime,
          endTime: r.event.endTime,
          venue: r.event.venue,
          zone: r.event.zone?.name || r.event.venue,
        })),
        ...availableOther.slice(0, 3).map((e) => ({
          type: 'RECOMMENDED_OPEN' as const,
          eventId: e.id,
          title: e.name,
          name: e.name,
          category: e.category,
          date: e.date,
          startTime: e.startTime,
          endTime: e.endTime,
          venue: e.venue,
          zone: e.zone?.name || e.venue,
        })),
      ].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

      // Conflict detection
      const conflicts: string[] = [];
      for (let i = 0; i < timeline.length - 1; i++) {
        const cur = timeline[i];
        const next = timeline[i + 1];
        if (cur.endTime && next.startTime && cur.endTime > next.startTime) {
          conflicts.push(`Time conflict between "${cur.name}" and "${next.name}"`);
        }
      }

      return {
        itinerary: timeline,
        conflictsFound: conflicts,
        advice:
          conflicts.length > 0
            ? 'You have overlapping sessions. Consider picking the priority event.'
            : 'Your schedule has clear transit intervals between sessions!',
      };
    }

    // ------------------------------------------------
    // ADMIN TOOLS
    // ------------------------------------------------
    case 'get_my_events_stats': {
      if (args.eventId) {
        const event = await prisma.event.findUnique({
          where: { id: Number(args.eventId) },
          include: {
            fest: true,
            _count: {
              select: {
                registrations: { where: { status: { not: 'CANCELLED' } } },
              },
            },
          },
        });

        if (!event) {
          return { error: `Event with ID ${args.eventId} not found.` };
        }

        // Cross-tenant verification:
        const ownsEvent = event.createdById === userId || event.fest?.ownerId === userId;
        if (!ownsEvent) {
          return {
            error: 'Access Denied: You do not own this event or its festival.',
          };
        }

        const checkedInCount = await prisma.registration.count({
          where: { eventId: event.id, status: 'CHECKED_IN' },
        });

        const registeredCount = event._count.registrations;
        return {
          eventId: event.id,
          title: event.name,
          name: event.name,
          maxParticipants: event.maxParticipants,
          registeredCount,
          checkedInCount,
          remainingSeats: Math.max(0, event.maxParticipants - registeredCount),
          attendanceRate:
            registeredCount > 0 ? `${Math.round((checkedInCount / registeredCount) * 100)}%` : '0%',
        };
      }

      // Aggregate overview for all admin's events
      const events = await prisma.event.findMany({
        where: {
          OR: [{ createdById: userId }, { fest: { ownerId: userId } }],
        },
        include: {
          _count: {
            select: {
              registrations: { where: { status: { not: 'CANCELLED' } } },
            },
          },
        },
      });

      let totalCapacity = 0;
      let totalRegistered = 0;

      const breakdown = await Promise.all(
        events.map(async (e) => {
          totalCapacity += e.maxParticipants;
          totalRegistered += e._count.registrations;
          const checkedIn = await prisma.registration.count({
            where: { eventId: e.id, status: 'CHECKED_IN' },
          });
          return {
            id: e.id,
            title: e.name,
            name: e.name,
            maxParticipants: e.maxParticipants,
            registered: e._count.registrations,
            checkedIn,
          };
        })
      );

      return {
        totalEvents: events.length,
        totalCapacity,
        totalRegistered,
        overallFillRate:
          totalCapacity > 0 ? `${Math.round((totalRegistered / totalCapacity) * 100)}%` : '0%',
        events: breakdown,
      };
    }

    case 'list_registrations_for_event': {
      const eventId = Number(args.eventId);
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { fest: true },
      });

      if (!event) {
        return { error: `Event with ID ${eventId} not found.` };
      }

      // Cross-tenant verification
      if (event.createdById !== userId && event.fest?.ownerId !== userId) {
        return {
          error: 'Access Denied: Cross-tenant access prevented. You do not own this event.',
        };
      }

      const page = Math.max(1, Number(args.page) || 1);
      const pageSize = Math.min(50, Math.max(1, Number(args.pageSize) || 20));
      const skip = (page - 1) * pageSize;

      const [total, attendees] = await Promise.all([
        prisma.registration.count({ where: { eventId } }),
        prisma.registration.findMany({
          where: { eventId },
          include: {
            user: { select: { id: true, username: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
      ]);

      return {
        eventId,
        eventTitle: event.name,
        name: event.name,
        page,
        pageSize,
        totalAttendees: total,
        attendees: attendees.map((a) => ({
          registrationId: a.id,
          username: a.user.username,
          status: a.status,
          registeredAt: a.createdAt,
          createdAt: a.createdAt,
        })),
      };
    }

    case 'draft_event_description': {
      const rawNotes = sanitizeOrganizerText(args.bullet_points || '');
      const audience = args.target_audience || 'All College Students';

      // Returns structured draft representation
      return {
        draft: {
          title: 'Campus HackSprint & Tech Showcase',
          name: 'Campus HackSprint & Tech Showcase',
          description: `Get ready for an adrenaline-fueled day of building, learning, and competing! ${rawNotes}\n\nJoin peers, showcase cutting-edge solutions, and win exciting prizes. Open to all skill levels.`,
          category: 'Tech / Hackathon',
          targetAudience: audience,
          suggestedCapacity: 100,
          scheduleTip: 'Best scheduled between 10:00 AM and 5:00 PM with lunch break.',
        },
      };
    }

    case 'draft_announcement': {
      const updateType = args.update_type || 'update';
      const rawDetails = sanitizeOrganizerText(args.key_details || '');

      let eventTitle = '';
      if (args.eventId) {
        const ev = await prisma.event.findUnique({
          where: { id: Number(args.eventId) },
          include: { fest: true },
        });
        if (ev && (ev.createdById === userId || ev.fest?.ownerId === userId)) {
          eventTitle = `[${ev.name}] `;
        }
      }

      const prefix =
        updateType === 'venue_change'
          ? '📍 VENUE UPDATE:'
          : updateType === 'delay'
          ? '⏰ SCHEDULE NOTICE:'
          : '📢 ANNOUNCEMENT:';

      const announcement = `${prefix} ${eventTitle}${args.key_details.slice(0, 150)} — check live schedule in Festify app!`;

      return {
        announcement,
        characterCount: announcement.length,
        readyToBroadcast: true,
      };
    }

    default:
      return { error: `Unrecognized tool '${toolName}'.` };
  }
}
