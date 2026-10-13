/**
 * Phase 4 Integration Tests — Crowd Density & Gate Telemetry
 *
 * Assertions:
 *  1.  GET /api/fests/:festId/density — returns correct structure (public, no auth)
 *  2.  POST checkin → totalCheckedIn increments in density response
 *  3.  GateLog DB record exists after check-in
 *  4.  GET /density/history/:zoneId — cross-tenant admin gets 403
 *  5.  GET /density/history/:zoneId — owner gets 200 with snapshots array
 *  6.  POST /density/snapshot — cross-tenant admin gets 403
 *  7.  POST /density/snapshot — owner creates snapshots (201)
 *  8.  Snapshot history grows after second call
 */

import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import eventRoutes from '../routes/events.js';
import densityRoutes from '../routes/density.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// ─── Minimal test server ────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api', eventRoutes);
app.use('/api', densityRoutes);

let server: http.Server;
let baseUrl: string;

function req(method: string, path: string, body?: object, token?: string) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

// ─── State ───────────────────────────────────────────────────────────────────
let adminToken = '';
let otherAdminToken = '';
let studentToken = '';
let festId = 0;
let eventId = 0;
let zoneId = 0;
let regId = 0;
let qrToken = '';

async function setup() {
  console.log('\n🔧 Setting up Phase 4 test data...');
  await prisma.user.deleteMany({
    where: { username: { in: ['ph4_admin', 'ph4_other', 'ph4_student'] } },
  });

  const hashed = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: { username: 'ph4_admin', password: hashed, role: 'ADMIN' },
  });
  festId = admin.id;
  adminToken = jwt.sign({ id: admin.id, username: admin.username, role: 'ADMIN' }, JWT_SECRET);

  const other = await prisma.user.create({
    data: { username: 'ph4_other', password: hashed, role: 'ADMIN' },
  });
  otherAdminToken = jwt.sign({ id: other.id, username: other.username, role: 'ADMIN' }, JWT_SECRET);

  const student = await prisma.user.create({
    data: { username: 'ph4_student', password: hashed, role: 'STUDENT' },
  });
  studentToken = jwt.sign({ id: student.id, username: student.username, role: 'STUDENT' }, JWT_SECRET);

  // Create Fest row
  const fest = await prisma.fest.create({ data: { name: 'Phase4 Fest', ownerId: admin.id } });

  // Create a VenueZone
  const zone = await prisma.venueZone.create({
    data: {
      name: 'Main Stage',
      type: 'zone',
      category: 'stage',
      coordinates: '[[100,100],[200,100],[200,200],[100,200]]',
      festId: fest.id,
    },
  });
  zoneId = zone.id;

  // Create an Event attached to that zone
  const event = await prisma.event.create({
    data: {
      name: 'Phase4 Show',
      description: 'Test event for Phase 4',
      category: 'Music',
      date: '2026-12-01',
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      venue: 'Main Stage',
      maxParticipants: 50,
      registrationDeadline: '2026-11-30',
      createdById: admin.id,
      zoneId: zone.id,
    },
  });
  eventId = event.id;

  // Register the student via API
  const regRes = await req('POST', `/api/events/${eventId}/register`, {}, studentToken);
  if (regRes.ok) {
    const d = await regRes.json() as any;
    regId = d.id;
    qrToken = d.qrToken;
    console.log(`  ✔ Registration created: id=${regId}`);
  } else {
    console.error('  ✘ Registration failed');
  }
}

async function teardown() {
  // Delete child rows before users to satisfy FK constraints
  const adminUsers = await prisma.user.findMany({
    where: { username: { in: ['ph4_admin', 'ph4_other', 'ph4_student'] } },
    select: { id: true },
  });
  const adminIds = adminUsers.map((u) => u.id);

  await prisma.gateLog.deleteMany({ where: { adminId: { in: adminIds } } });
  await prisma.crowdSnapshot.deleteMany({ where: { adminId: { in: adminIds } } });

  // Registrations depend on Events; Events depend on Users
  const events = await prisma.event.findMany({ where: { createdById: { in: adminIds } }, select: { id: true } });
  const eventIds = events.map((e) => e.id);
  await prisma.registration.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.registration.deleteMany({ where: { userId: { in: adminIds } } });
  await prisma.event.deleteMany({ where: { id: { in: eventIds } } });

  // VenueZones and Fests
  const fests = await prisma.fest.findMany({ where: { ownerId: { in: adminIds } }, select: { id: true } });
  const festIds = fests.map((f) => f.id);
  await prisma.venueZone.deleteMany({ where: { festId: { in: festIds } } });
  await prisma.notification.deleteMany({ where: { festId: { in: festIds } } });
  await prisma.fest.deleteMany({ where: { id: { in: festIds } } });

  await prisma.user.deleteMany({ where: { id: { in: adminIds } } });
  await prisma.$disconnect();
}

// ─── Tests ────────────────────────────────────────────────────────────────────
async function runTests() {
  // Start server on random port
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as any;
      baseUrl = `http://localhost:${addr.port}`;
      console.log(`\n🧪 Phase 4 Test Server on port ${addr.port}\n`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}${detail ? ' — ' + detail : ''}`);
      failed++;
    }
  }

  await setup();

  // ── 1. GET /density — public, correct structure ───────────────────────────
  {
    const r = await req('GET', `/api/fests/${festId}/density`);
    const d = await r.json() as any;
    assert(
      r.status === 200 && typeof d.festId === 'number' && Array.isArray(d.densityByZone),
      'GET /density — 200 with festId and densityByZone array',
      JSON.stringify(d)
    );
  }

  // ── 2. Check-in increments totalCheckedIn ────────────────────────────────
  {
    const before = await (await req('GET', `/api/fests/${festId}/density`)).json() as any;
    const beforeCount: number = before.totalCheckedIn ?? 0;

    const ciRes = await req('POST', `/api/registrations/${regId}/checkin`, { qrToken }, adminToken);
    const ciData = await ciRes.json() as any;
    assert(ciRes.status === 200 && ciData.success === true, 'POST /checkin — returns 200 success', JSON.stringify(ciData));

    // Allow async GateLog write
    await new Promise((r) => setTimeout(r, 300));

    const after = await (await req('GET', `/api/fests/${festId}/density`)).json() as any;
    assert(
      after.totalCheckedIn === beforeCount + 1,
      'GET /density — totalCheckedIn increments by 1 after check-in',
      `before=${beforeCount} after=${after.totalCheckedIn}`
    );
  }

  // ── 3. GateLog DB record exists ───────────────────────────────────────────
  {
    await new Promise((r) => setTimeout(r, 300));
    const logCount = await prisma.gateLog.count({ where: { eventId } });
    assert(logCount >= 1, 'GateLog row written to DB after check-in', `count=${logCount}`);
  }

  // ── 4. Cross-tenant admin → 403 on density history ───────────────────────
  {
    const r = await req('GET', `/api/fests/${festId}/density/history/${zoneId}`, undefined, otherAdminToken);
    assert(r.status === 403, 'GET /density/history — cross-tenant admin gets 403', `status=${r.status}`);
  }

  // ── 5. Owner gets density history ─────────────────────────────────────────
  {
    const r = await req('GET', `/api/fests/${festId}/density/history/${zoneId}`, undefined, adminToken);
    const d = await r.json() as any;
    assert(r.status === 200 && Array.isArray(d.snapshots), 'GET /density/history — owner gets 200 with snapshots[]', JSON.stringify(d));
  }

  // ── 6. Cross-tenant admin → 403 on snapshot ──────────────────────────────
  {
    const r = await req('POST', `/api/fests/${festId}/density/snapshot`, {}, otherAdminToken);
    assert(r.status === 403, 'POST /density/snapshot — cross-tenant admin gets 403', `status=${r.status}`);
  }

  // ── 7. Owner creates snapshot ─────────────────────────────────────────────
  {
    const r = await req('POST', `/api/fests/${festId}/density/snapshot`, {}, adminToken);
    const d = await r.json() as any;
    assert(r.status === 201 && typeof d.created === 'number', 'POST /density/snapshot — owner gets 201 with created count', JSON.stringify(d));
  }

  // ── 8. Snapshot history grows after 2nd call ──────────────────────────────
  {
    await req('POST', `/api/fests/${festId}/density/snapshot`, {}, adminToken);
    const histRes = await req('GET', `/api/fests/${festId}/density/history/${zoneId}`, undefined, adminToken);
    const d = await histRes.json() as any;
    assert(
      histRes.status === 200 && Array.isArray(d.snapshots) && d.snapshots.length >= 2,
      'GET /density/history — ≥ 2 snapshots after 2 snapshot calls',
      `count=${d.snapshots?.length}`
    );
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  if (failed === 0) {
    console.log('🎉 All Phase 4 crowd density tests passed!');
  } else {
    console.error(`❌ ${failed} test(s) failed.`);
  }

  return failed;
}

// ─── Entry ────────────────────────────────────────────────────────────────────
const failCount = await runTests();
await teardown();
server!.close();
process.exit(failCount > 0 ? 1 : 0);
