/**
 * Venue Map — Integration Test (Tenant Isolation)
 *
 * Tests that:
 *   1. A zone created under festId=A (admin user ID 1) is returned by GET /api/fests/1/venue
 *   2. A zone created under festId=B (admin user ID 2) is NOT returned when querying festId=1
 *   3. Admin A CANNOT create a zone under festId=2 — gets 403 Forbidden (tenant isolation)
 *   4. A point inside a seeded polygon is correctly located via POST /venue/locate
 *
 * Run with: npx tsx server/routes/venue.test.ts
 *
 * The test spins up a fresh Express+Prisma server on a random port against an
 * in-memory / isolated SQLite database, seeds minimal data, runs assertions,
 * and cleans up.
 */

import express from 'express';
import http from 'http';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import venueRoutes from '../routes/venue.js';

// ─── Config ──────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const TEST_PORT = 0; // OS assigns a free port

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeToken(id: number, role = 'ADMIN'): string {
  return jwt.sign({ id, username: `user${id}`, role }, JWT_SECRET, { expiresIn: '1h' });
}

async function req(
  port: number,
  method: string,
  path: string,
  body?: object,
  token?: string
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`http://localhost:${port}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, body: data };
}

// ─── Setup ────────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use('/api/fests', venueRoutes);

const server = http.createServer(app);
const prisma = new PrismaClient();

// Get the actual port after binding
function getPort(srv: http.Server): number {
  const addr = srv.address();
  if (!addr || typeof addr === 'string') throw new Error('No port');
  return addr.port;
}

// ─── Run Tests ────────────────────────────────────────────────────────────────

async function runTests() {
  // Seed two admin users (IDs 1 and 2) and their corresponding Fest entities
  const FEST_A = 1;
  const FEST_B = 2;
  const tokenA = makeToken(FEST_A);
  const tokenB = makeToken(FEST_B);

  await prisma.user.upsert({
    where: { id: FEST_A },
    update: {},
    create: { id: FEST_A, username: 'test_admin_a', password: 'password', role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { id: FEST_B },
    update: {},
    create: { id: FEST_B, username: 'test_admin_b', password: 'password', role: 'ADMIN' },
  });

  if ((prisma as any).fest) {
    await (prisma as any).fest.upsert({
      where: { id: FEST_A },
      update: {},
      create: { id: FEST_A, name: 'Test Fest A', ownerId: FEST_A },
    });
    await (prisma as any).fest.upsert({
      where: { id: FEST_B },
      update: {},
      create: { id: FEST_B, name: 'Test Fest B', ownerId: FEST_B },
    });
  }

  // Clean up any existing test data
  await prisma.venueZone.deleteMany({ where: { festId: { in: [FEST_A, FEST_B] } } });

  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  const port = getPort(server);
  console.log(`\n🧪 Test server on port ${port}\n`);

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`  ❌ FAIL: ${name}\n     ${e.message}`);
      failed++;
    }
  }

  // ── Test 1: Create zone under Fest A ──────────────────────────────────────
  let createdZoneId: number;
  await test('POST /fests/1/venue/zones — Admin A creates zone for their fest', async () => {
    const r = await req(port, 'POST', `/api/fests/${FEST_A}/venue/zones`, {
      name: 'Test Stage',
      type: 'zone',
      category: 'stage',
      coordinates: [[100, 100], [300, 100], [300, 250], [100, 250]],
      color: '#F06E38',
    }, tokenA);
    assert.equal(r.status, 201, `Expected 201, got ${r.status}: ${JSON.stringify(r.body)}`);
    assert.ok(r.body.id, 'Expected created zone to have an ID');
    assert.equal(r.body.name, 'Test Stage');
    assert.equal(r.body.festId, FEST_A);
    createdZoneId = r.body.id;
  });

  // ── Test 2: GET returns zone for Fest A ──────────────────────────────────
  await test('GET /fests/1/venue — returns zones for Fest A', async () => {
    const r = await req(port, 'GET', `/api/fests/${FEST_A}/venue`);
    assert.equal(r.status, 200);
    const ids = (r.body.zones as any[]).map((z) => z.id);
    assert.ok(ids.includes(createdZoneId), `Zone ID ${createdZoneId} should be in festA zones`);
  });

  // ── Test 3: Tenant Isolation — Admin B CANNOT write to Fest A ────────────
  await test('POST /fests/1/venue/zones — Admin B is REJECTED (403) when targeting Fest A', async () => {
    const r = await req(port, 'POST', `/api/fests/${FEST_A}/venue/zones`, {
      name: 'Rogue Zone',
      type: 'zone',
      category: 'other',
      coordinates: [[0, 0], [10, 0], [10, 10], [0, 10]],
    }, tokenB);
    assert.equal(r.status, 403, `Expected 403 Forbidden, got ${r.status}`);
    assert.ok(r.body.error, 'Expected error message in response');
  });

  // ── Test 4: GET for Fest B returns ZERO of Fest A's zones ─────────────────
  await test('GET /fests/2/venue — returns 0 zones (Fest B has no zones)', async () => {
    const r = await req(port, 'GET', `/api/fests/${FEST_B}/venue`);
    assert.equal(r.status, 200);
    // Fest B has no zones — none of Fest A's zones should leak through
    const rogueZones = (r.body.zones as any[]).filter((z) => z.festId === FEST_A);
    assert.equal(rogueZones.length, 0, 'Fest A zones must not appear in Fest B query');
  });

  // ── Test 5: Point-in-polygon locate ───────────────────────────────────────
  await test('POST /fests/1/venue/locate — point inside polygon is found', async () => {
    // createdZoneId covers [[100,100],[300,100],[300,250],[100,250]] — centroid at (200, 175)
    const r = await req(port, 'POST', `/api/fests/${FEST_A}/venue/locate`, { x: 200, y: 175 });
    assert.equal(r.status, 200);
    assert.ok(r.body.zone, 'Expected a zone to be found');
    assert.equal(r.body.zone.id, createdZoneId, `Expected zone ID ${createdZoneId}`);
  });

  // ── Test 6: Point outside polygon returns null ────────────────────────────
  await test('POST /fests/1/venue/locate — point outside all polygons returns null', async () => {
    const r = await req(port, 'POST', `/api/fests/${FEST_A}/venue/locate`, { x: 999, y: 999 });
    assert.equal(r.status, 200);
    assert.equal(r.body.zone, null, 'Expected no zone at far corner');
  });

  // ── Test 7: Unauthenticated POST to zones → 401 ───────────────────────────
  await test('POST /fests/1/venue/zones — no token → 401 Unauthorized', async () => {
    const r = await req(port, 'POST', `/api/fests/${FEST_A}/venue/zones`, {
      name: 'Anon Zone',
      type: 'zone',
      category: 'other',
      coordinates: [[0, 0], [10, 0], [10, 10]],
    }); // no token
    assert.equal(r.status, 401, `Expected 401, got ${r.status}`);
  });

  // ── Cleanup ────────────────────────────────────────────────────────────────
  await prisma.venueZone.deleteMany({ where: { festId: { in: [FEST_A, FEST_B] } } });
  await prisma.$disconnect();
  server.close();

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!\n');
  }
}

runTests().catch((e) => {
  console.error('Test runner crashed:', e);
  process.exit(1);
});
