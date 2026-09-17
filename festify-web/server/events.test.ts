/**
 * Event Management & Tenant Security — Integration Test
 *
 * Tests:
 *   1. Admin A can create an event under their fest (festId / createdById = Admin A).
 *   2. Admin A can update and delete their own event.
 *   3. CROSS-TENANT SECURITY CHECK: Admin B attempting PUT or DELETE on Admin A's event MUST be rejected with HTTP 403 Forbidden.
 */

import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import venueRoutes from './routes/venue.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', eventRoutes);
app.use('/api/fests', venueRoutes);

let server: http.Server;
let baseUrl: string;

function put(path: string, body: any, token?: string) {
  return fetch(`${baseUrl}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

function del(path: string, token?: string) {
  return fetch(`${baseUrl}${path}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

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

async function runTests() {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as any;
      baseUrl = `http://localhost:${addr.port}/api`;
      console.log(`\n🧪 Events Security Test server running on port ${addr.port}\n`);
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
    // ─── Setup Admin A & Admin B Accounts ──────────────────────────────────
    const adminA = await prisma.user.upsert({
      where: { username: 'evt_admin_a' },
      update: {},
      create: { username: 'evt_admin_a', password: 'password', role: 'ADMIN' },
    });
    const tokenA = jwt.sign({ id: adminA.id, username: adminA.username, role: adminA.role }, JWT_SECRET);

    const adminB = await prisma.user.upsert({
      where: { username: 'evt_admin_b' },
      update: {},
      create: { username: 'evt_admin_b', password: 'password', role: 'ADMIN' },
    });
    const tokenB = jwt.sign({ id: adminB.id, username: adminB.username, role: adminB.role }, JWT_SECRET);

    // ─── Create Event for Admin A ──────────────────────────────────────────
    const createRes = await post(
      '/admin/events',
      {
        name: 'Admin A Exclusive Concert',
        description: 'Event owned by Admin A',
        category: 'Cultural',
        date: '2026-11-25',
        startTime: '07:00 PM',
        endTime: '10:00 PM',
        venue: 'Main Arena',
        maxParticipants: 500,
        registrationDeadline: '2026-11-24',
      },
      tokenA
    );
    const eventA = await createRes.json();
    assert(createRes.status === 201 && eventA.createdById === adminA.id, 'Admin A created event under their fest');

    // ─── Test 1: Admin A can update their own event ───────────────────────
    const updateResA = await put(
      `/admin/events/${eventA.id}`,
      { name: 'Admin A Concert (Updated Title)' },
      tokenA
    );
    assert(updateResA.status === 200, 'Admin A successfully updated their own event');

    // ─── Test 2: CROSS-TENANT SECURITY: Admin B CANNOT update Admin A's event ─
    const updateResB = await put(
      `/admin/events/${eventA.id}`,
      { name: 'Hacked Title by Admin B' },
      tokenB
    );
    const updateDataB = await updateResB.json();
    assert(
      updateResB.status === 403 && updateDataB.error.includes('Forbidden'),
      'CROSS-TENANT WRITE PREVENTED: Admin B is REJECTED (403 Forbidden) when attempting PUT on Admin A event'
    );

    // ─── Test 3: CROSS-TENANT SECURITY: Admin B CANNOT delete Admin A's event ─
    const delResB = await del(`/admin/events/${eventA.id}`, tokenB);
    const delDataB = await delResB.json();
    assert(
      delResB.status === 403 && delDataB.error.includes('Forbidden'),
      'CROSS-TENANT WRITE PREVENTED: Admin B is REJECTED (403 Forbidden) when attempting DELETE on Admin A event'
    );

    // ─── Test 4: Admin A can delete their own event ────────────────────────
    const delResA = await del(`/admin/events/${eventA.id}`, tokenA);
    assert(delResA.status === 200, 'Admin A successfully deleted their own event');

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
    console.log(`🎉 All event security integration tests passed!\n`);
  } else {
    process.exit(1);
  }
}

runTests();
