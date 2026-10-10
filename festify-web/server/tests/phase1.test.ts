import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import authRoutes from '../routes/auth.js';
import eventRoutes from '../routes/events.js';
import venueRoutes from '../routes/venue.js';
import notificationRoutes from '../routes/notifications.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', eventRoutes);
app.use('/api', notificationRoutes);
app.use('/api/fests', venueRoutes);

let server: http.Server;
let baseUrl: string;

function post(path: string, body: any, token?: string) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

function get(path: string, token?: string) {
  return fetch(`${baseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

async function runTests() {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as any;
      baseUrl = `http://localhost:${addr.port}/api`;
      console.log(`\n🧪 Phase 1 Core Gaps Test Server running on port ${addr.port}\n`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  const suffix = Date.now();

  try {
    // ─── Setup Admin A, Admin B, and Student ──────────────────────────────────
    const adminA = await prisma.user.upsert({
      where: { username: `p1_admin_a_${suffix}` },
      update: {},
      create: { username: `p1_admin_a_${suffix}`, password: 'password', role: 'ADMIN' },
    });
    const festA = await prisma.fest.upsert({
      where: { id: adminA.id },
      update: {},
      create: { id: adminA.id, name: 'Fest A', ownerId: adminA.id },
    });
    const tokenA = jwt.sign({ id: adminA.id, username: adminA.username, role: adminA.role }, JWT_SECRET);

    const adminB = await prisma.user.upsert({
      where: { username: `p1_admin_b_${suffix}` },
      update: {},
      create: { username: `p1_admin_b_${suffix}`, password: 'password', role: 'ADMIN' },
    });
    const tokenB = jwt.sign({ id: adminB.id, username: adminB.username, role: adminB.role }, JWT_SECRET);

    const student = await prisma.user.upsert({
      where: { username: `p1_student_${suffix}` },
      update: {},
      create: { username: `p1_student_${suffix}`, password: 'password', role: 'STUDENT' },
    });
    const tokenStudent = jwt.sign({ id: student.id, username: student.username, role: student.role }, JWT_SECRET);

    // ─── 1. Test Venue Zone Creation & Event ↔ Venue Link ──────────────────────
    const zoneRes = await post(
      `/fests/${festA.id}/venue/zones`,
      {
        name: 'Main Amphitheatre Zone',
        type: 'zone',
        category: 'stage',
        color: '#EC6484',
        coordinates: [[72.8, 19.1], [72.9, 19.1], [72.9, 19.2], [72.8, 19.1]]
      },
      tokenA
    );
    const zoneData = await zoneRes.json();
    assert(zoneRes.status === 201 && zoneData.id, 'Admin A created a venue zone');

    const eventRes = await post(
      '/admin/events',
      {
        name: 'Battle of the Bands 2026',
        description: 'Epic band showdown on main stage',
        category: 'Cultural',
        date: '2026-11-20',
        startTime: '06:00 PM',
        endTime: '10:00 PM',
        venue: 'Main Amphitheatre',
        maxParticipants: 100,
        registrationDeadline: '2026-11-19',
        zoneId: zoneData.id
      },
      tokenA
    );
    const eventData = await eventRes.json();
    assert(
      eventRes.status === 201 && eventData.zoneId === zoneData.id && eventData.zone?.name === 'Main Amphitheatre Zone',
      'Event created with valid zone link (zoneId & populated zone relation)'
    );

    // ─── 2. Test Notifications & Cross-Tenant Security ───────────────────────
    // Admin A creates fest-wide notification
    const notifFestRes = await post(
      '/notifications',
      { message: 'Welcome to Fest A!', targetType: 'fest' },
      tokenA
    );
    assert(notifFestRes.status === 201, 'Admin A published fest-wide notification');

    // Admin A creates targeted notification for event A
    const notifEventRes = await post(
      '/notifications',
      { message: 'Sound check starts in 15 mins', targetType: 'event', targetEventId: eventData.id },
      tokenA
    );
    assert(notifEventRes.status === 201, 'Admin A published targeted notification for their event');

    // CROSS-TENANT SECURITY: Admin B CANNOT target Admin A's event
    const notifCrossRes = await post(
      '/notifications',
      { message: 'Hacked alert by Admin B', targetType: 'event', targetEventId: eventData.id },
      tokenB
    );
    assert(
      notifCrossRes.status === 403,
      'CROSS-TENANT REJECTION: Admin B is REJECTED (403) when attempting notification on Admin A event'
    );

    // Student fetches notifications before registering -> gets only fest-wide notification
    const studentNotifPre = await get('/notifications', tokenStudent);
    const studentNotifPreData = await studentNotifPre.json();
    const festOnly = studentNotifPreData.filter((n: any) => n.targetType === 'fest');
    const eventOnly = studentNotifPreData.filter((n: any) => n.targetType === 'event');
    assert(
      studentNotifPre.status === 200 && festOnly.length >= 1 && eventOnly.length === 0,
      'Unregistered student receives fest-wide alerts, but NOT event-targeted alerts'
    );

    // Student registers for Event A
    const regRes = await post(`/events/${eventData.id}/register`, {}, tokenStudent);
    assert(regRes.status === 201, 'Student registered for Event A');

    // Student fetches notifications after registering -> receives both fest-wide and event-targeted notification
    const studentNotifPost = await get('/notifications', tokenStudent);
    const studentNotifPostData = await studentNotifPost.json();
    const eventTargetedRecv = studentNotifPostData.filter((n: any) => n.targetEventId === eventData.id);
    assert(
      studentNotifPost.status === 200 && eventTargetedRecv.length >= 1,
      'Registered student receives event-targeted alert after registering'
    );

  } catch (err) {
    console.error('Phase 1 test execution error:', err);
    failed++;
  } finally {
    server.close();
    await prisma.$disconnect();
  }

  console.log(`\n──────────────────────────────────────────────────`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  if (failed === 0) {
    console.log(`🎉 All Phase 1 integration tests passed!\n`);
  } else {
    process.exit(1);
  }
}

runTests();
