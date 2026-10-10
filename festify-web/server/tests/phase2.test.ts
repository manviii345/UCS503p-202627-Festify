import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';
import authRoutes from '../routes/auth.js';
import eventRoutes from '../routes/events.js';
import venueRoutes from '../routes/venue.js';
import notificationRoutes from '../routes/notifications.js';
import { initSocketServer } from '../socket.js';

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
let wsUrl: string;

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
  server = http.createServer(app);
  initSocketServer(server);

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const addr = server.address() as any;
      baseUrl = `http://localhost:${addr.port}/api`;
      wsUrl = `http://localhost:${addr.port}`;
      console.log(`\n🧪 Phase 2 Real-Time Socket.IO Test Server running on port ${addr.port}\n`);
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
    // ─── 1. Setup Admin A & Admin B (with Fest records for FK integrity) ──────
    const adminA = await prisma.user.upsert({
      where: { username: `p2_admin_a_${suffix}` },
      update: {},
      create: { username: `p2_admin_a_${suffix}`, password: 'password', role: 'ADMIN' },
    });
    // Ensure a Fest record exists for Admin A (needed by notification route's festId = user.id)
    await prisma.fest.upsert({
      where: { id: adminA.id },
      update: {},
      create: { id: adminA.id, name: `Phase2 Fest A ${suffix}`, ownerId: adminA.id },
    });
    const tokenA = jwt.sign({ id: adminA.id, username: adminA.username, role: adminA.role }, JWT_SECRET);

    const adminB = await prisma.user.upsert({
      where: { username: `p2_admin_b_${suffix}` },
      update: {},
      create: { username: `p2_admin_b_${suffix}`, password: 'password', role: 'ADMIN' },
    });
    const tokenB = jwt.sign({ id: adminB.id, username: adminB.username, role: adminB.role }, JWT_SECRET);

    // ─── 2. Test Socket Auth Failure ──────────────────────────────────────────
    const unauthSocket = ClientIO(wsUrl, {
      auth: { token: 'invalid.jwt.token' },
      transports: ['websocket'],
      reconnection: false,
    });

    const authErrPromise = new Promise<boolean>((resolve) => {
      unauthSocket.on('connect_error', (err) => {
        resolve(err.message.includes('Authentication error'));
      });
      unauthSocket.on('connect', () => resolve(false));
    });

    const isAuthBlocked = await authErrPromise;
    assert(isAuthBlocked, 'Unauthenticated socket connection rejected with Authentication error');
    unauthSocket.close();

    // ─── 3. Test Admin A Connect & Authorized Room Join ─────────────────────
    const socketA = ClientIO(wsUrl, {
      auth: { token: tokenA },
      transports: ['websocket'],
      reconnection: false,
    });

    await new Promise<void>((resolve) => socketA.on('connect', resolve));
    assert(socketA.connected, 'Admin A connected to Socket.IO with valid JWT');

    const joinAckA = await new Promise<any>((resolve) => {
      socketA.emit('join_fest', { festId: adminA.id }, (response: any) => {
        resolve(response);
      });
    });
    assert(joinAckA.success && joinAckA.room === `fest_${adminA.id}`, 'Admin A joined their own fest room');

    // ─── 4. Test CROSS-TENANT Room Join Rejection ───────────────────────────
    const socketB = ClientIO(wsUrl, {
      auth: { token: tokenB },
      transports: ['websocket'],
      reconnection: false,
    });
    await new Promise<void>((resolve) => socketB.on('connect', resolve));

    const joinAckB = await new Promise<any>((resolve) => {
      socketB.emit('join_fest', { festId: adminA.id }, (response: any) => {
        resolve(response);
      });
    });
    assert(
      joinAckB && joinAckB.error && joinAckB.error.includes('Cross-tenant'),
      'CROSS-TENANT REJECTION: Admin B is REJECTED when attempting to join Admin A fest room'
    );

    // ─── 5. Test Live Push Event Broadcasting ───────────────────────────────
    const notifPromise = Promise.race([
      new Promise<any>((resolve) => {
        socketA.on('notification_broadcast', (data) => resolve(data));
      }),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Notification broadcast timed out after 10s')), 10000)),
    ]);

    await post('/notifications', { message: 'Realtime Alert Push Test', targetType: 'fest' }, tokenA);
    const recvNotif = await notifPromise;
    assert(
      recvNotif && recvNotif.message === 'Realtime Alert Push Test',
      'Real-time broadcast notification received live on fest room'
    );

    socketA.close();
    socketB.close();

  } catch (err) {
    console.error('Phase 2 test execution error:', err);
    failed++;
  } finally {
    server.close();
    await prisma.$disconnect();
  }

  console.log(`\n──────────────────────────────────────────────────`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  if (failed === 0) {
    console.log(`🎉 All Phase 2 real-time integration tests passed!\n`);
  } else {
    process.exit(1);
  }
}

runTests();
