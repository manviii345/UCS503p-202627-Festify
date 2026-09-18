/**
 * Registration & QR Pass — Integration & Concurrency Test
 *
 * Tests:
 *   1. Event listing includes capacity info (registeredCount, remainingSeats)
 *   2. CONCURRENCY TEST: Two simultaneous registration requests for an event with 1 remaining seat.
 *      Asserts that EXACTLY 1 succeeds (201) and EXACTLY 1 fails (400 Event is full).
 *   3. QR token verification: token signed with JWT_SECRET contains { userId, eventId, registrationId, issuedAt }.
 *   4. Check-in endpoint POST /api/registrations/:id/checkin verifies QR signature and updates status.
 */

import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import authRoutes from '../routes/auth.js';
import eventRoutes from '../routes/events.js';
import venueRoutes from '../routes/venue.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', eventRoutes);
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
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

async function runTests() {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as any;
      baseUrl = `http://localhost:${addr.port}/api`;
      console.log(`\n🧪 Registration Test server running on port ${addr.port}\n`);
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

  try {
    // ─── Setup Test Data ───────────────────────────────────────────────────
    
    // Create Admin User
    const admin = await prisma.user.upsert({
      where: { username: 'reg_admin' },
      update: {},
      create: { username: 'reg_admin', password: 'password', role: 'ADMIN' },
    });
    const adminToken = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, JWT_SECRET);

    // Create Student User 1
    const student1 = await prisma.user.upsert({
      where: { username: 'reg_student1' },
      update: {},
      create: { username: 'reg_student1', password: 'password', role: 'STUDENT' },
    });
    const student1Token = jwt.sign({ id: student1.id, username: student1.username, role: student1.role }, JWT_SECRET);

    // Create Student User 2
    const student2 = await prisma.user.upsert({
      where: { username: 'reg_student2' },
      update: {},
      create: { username: 'reg_student2', password: 'password', role: 'STUDENT' },
    });
    const student2Token = jwt.sign({ id: student2.id, username: student2.username, role: student2.role }, JWT_SECRET);

    // Create Event with maxParticipants = 1 (Strictly 1 seat available)
    const event = await prisma.event.create({
      data: {
        name: 'Exclusive VIP Workshop',
        description: 'Single seat exclusive workshop',
        category: 'Workshop',
        date: '2026-11-20',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        venue: 'Lab 1',
        maxParticipants: 1,
        registrationDeadline: '2026-11-19',
        createdById: admin.id,
      },
    });

    // ─── Test 1: GET /events includes capacity info ─────────────────────────
    const listRes = await get('/events');
    const listData = await listRes.json();
    const createdEventInList = listData.find((e: any) => e.id === event.id);
    assert(
      createdEventInList && createdEventInList.remainingSeats === 1 && createdEventInList.registeredCount === 0,
      'GET /events returns correct remainingSeats=1 and registeredCount=0'
    );

    // ─── Test 2: CONCURRENCY TEST — 2 Concurrent Registration Requests ───────
    console.log('\n  ⚡ Simulating 2 concurrent registration requests at 1 remaining seat...');
    
    const [res1, res2] = await Promise.all([
      post(`/events/${event.id}/register`, {}, student1Token),
      post(`/events/${event.id}/register`, {}, student2Token),
    ]);

    const status1 = res1.status;
    const status2 = res2.status;
    const data1 = await res1.json();
    const data2 = await res2.json();

    const successCount = (status1 === 201 ? 1 : 0) + (status2 === 201 ? 1 : 0);
    const fullCount = (status1 === 400 && data1.error === 'Event is full' ? 1 : 0) +
                      (status2 === 400 && data2.error === 'Event is full' ? 1 : 0);

    assert(
      successCount === 1 && fullCount === 1,
      `Concurrent registration: Exactly 1 succeeded (201) and 1 rejected (400 Event is full) [Statuses: ${status1}, ${status2}]`
    );

    const winningData = status1 === 201 ? data1 : data2;
    assert(
      !!winningData.qrToken && typeof winningData.qrToken === 'string',
      'Successful registration returned signed QR token'
    );

    // Verify JWT structure of winning QR token
    const decoded = jwt.verify(winningData.qrToken, JWT_SECRET) as any;
    assert(
      decoded.eventId === event.id && decoded.registrationId === winningData.id,
      'QR token contains valid decoded eventId and registrationId payload'
    );

    // ─── Test 3: Duplicate Registration Rejection ───────────────────────────
    const winningToken = status1 === 201 ? student1Token : student2Token;
    const dupRes = await post(`/events/${event.id}/register`, {}, winningToken);
    const dupData = await dupRes.json();
    assert(
      dupRes.status === 400 && (dupData.error.includes('Already registered') || dupData.error.includes('Event is full')),
      'Re-registering same user returns 400 error'
    );

    // ─── Test 4: Check-in Endpoint Verification ──────────────────────────────
    const checkinRes = await post(
      `/registrations/${winningData.id}/checkin`,
      { qrToken: winningData.qrToken },
      adminToken
    );
    const checkinData = await checkinRes.json();
    assert(
      checkinRes.status === 200 && checkinData.success && checkinData.registration.status === 'CHECKED_IN',
      'POST /registrations/:id/checkin successfully validates QR token and marks status CHECKED_IN'
    );

    // ─── Test 5: Re-checkin Prevention ─────────────────────────────────────
    const reCheckinRes = await post(
      `/registrations/${winningData.id}/checkin`,
      { qrToken: winningData.qrToken },
      adminToken
    );
    const reCheckinData = await reCheckinRes.json();
    assert(
      reCheckinRes.status === 400 && reCheckinData.error.includes('already checked in'),
      'Re-checking in an already checked in pass returns 400 error'
    );

    // Cleanup test event & registrations
    await prisma.registration.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    await prisma.$disconnect();
  }

  console.log(`\n──────────────────────────────────────────────────`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  if (failed === 0) {
    console.log(`🎉 All registration & concurrency tests passed!\n`);
  } else {
    process.exit(1);
  }
}

runTests();
