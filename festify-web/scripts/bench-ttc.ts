import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import { io as ClientIO } from 'socket.io-client';
import { performance } from 'perf_hooks';
import { PrismaClient } from '@prisma/client';
import authRoutes from '../server/routes/auth.js';
import eventRoutes from '../server/routes/events.js';
import venueRoutes from '../server/routes/venue.js';
import notificationRoutes from '../server/routes/notifications.js';
import { initSocketServer } from '../server/socket.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', eventRoutes);
app.use('/api', notificationRoutes);
app.use('/api/fests', venueRoutes);

const server = http.createServer(app);
initSocketServer(server);

async function runBenchmark() {
  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      resolve();
    });
  });

  const addr = server.address() as any;
  const baseUrl = `http://localhost:${addr.port}/api`;
  const wsUrl = `http://localhost:${addr.port}`;

  console.log(`\n⚡ Starting Time-to-Check-In (TTC) Benchmark over 100 runs...`);

  // 1. Setup Admin & Benchmark Event
  const suffix = Date.now();
  const admin = await prisma.user.upsert({
    where: { username: `bench_admin_${suffix}` },
    update: {},
    create: { username: `bench_admin_${suffix}`, password: 'password', role: 'ADMIN' },
  });
  const adminToken = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, JWT_SECRET);

  const event = await prisma.event.create({
    data: {
      name: `TTC Bench Event ${suffix}`,
      description: 'Benchmark testing',
      category: 'Technical',
      date: '2026-12-01',
      startTime: '10:00 AM',
      endTime: '05:00 PM',
      venue: 'Main Arena',
      maxParticipants: 1000,
      registrationDeadline: '2026-11-30',
      createdById: admin.id,
    },
  });

  // 2. Pre-create 100 Distinct Student Users & Registrations
  const NUM_RUNS = 100;
  const qrTokens: string[] = [];

  for (let i = 0; i < NUM_RUNS; i++) {
    const student = await prisma.user.create({
      data: {
        username: `bench_student_${suffix}_${i}`,
        password: 'password',
        role: 'STUDENT',
      },
    });

    const reg = await prisma.registration.create({
      data: {
        userId: student.id,
        eventId: event.id,
        qrToken: `bench_temp_${i}_${suffix}`,
        status: 'REGISTERED',
      },
    });

    const token = jwt.sign(
      { userId: student.id, eventId: event.id, registrationId: reg.id, issuedAt: Date.now() },
      JWT_SECRET
    );

    await prisma.registration.update({
      where: { id: reg.id },
      data: { qrToken: token },
    });

    qrTokens.push(token);
  }

  // 3. Connect Admin Socket Client to fest room
  const socket = ClientIO(wsUrl, {
    auth: { token: adminToken },
    transports: ['websocket'],
    reconnection: false,
  });

  await new Promise<void>((resolve) => socket.on('connect', resolve));
  await new Promise<void>((resolve) => {
    socket.emit('join_fest', { festId: admin.id }, () => resolve());
  });

  const latencies: number[] = [];

  // 4. Run 100 Check-In Benchmarks
  for (let i = 0; i < NUM_RUNS; i++) {
    const token = qrTokens[i];

    const updateReceivedPromise = new Promise<void>((resolve) => {
      const handler = (data: any) => {
        socket.off('checkin_update', handler);
        resolve();
      };
      socket.on('checkin_update', handler);
    });

    const start = performance.now();

    const res = await fetch(`${baseUrl}/registrations/scan-checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ qrToken: token }),
    });

    if (!res.ok) {
      console.error(`Benchmark run ${i + 1} HTTP failed:`, res.status);
    }

    await updateReceivedPromise;
    const end = performance.now();

    latencies.push(end - start);
  }

  socket.close();
  server.close();

  // Cleanup benchmark test users & event
  await prisma.registration.deleteMany({ where: { eventId: event.id } });
  await prisma.event.delete({ where: { id: event.id } });
  await prisma.user.deleteMany({ where: { username: { startsWith: `bench_student_${suffix}` } } });
  await prisma.user.deleteMany({ where: { username: `bench_admin_${suffix}` } });
  await prisma.$disconnect();

  // 5. Calculate Metrics
  latencies.sort((a, b) => a - b);
  const median = latencies[Math.floor(NUM_RUNS * 0.5)];
  const p95 = latencies[Math.floor(NUM_RUNS * 0.95)];
  const mean = latencies.reduce((acc, val) => acc + val, 0) / NUM_RUNS;

  console.log(`\n==================================================`);
  console.log(`📊 Time-to-Check-In (TTC) Benchmark Results (100 runs)`);
  console.log(`==================================================`);
  console.log(`  Runs Completed : ${NUM_RUNS}`);
  console.log(`  Median Latency : ${median.toFixed(2)} ms`);
  console.log(`  P95 Latency    : ${p95.toFixed(2)} ms`);
  console.log(`  Mean Latency   : ${mean.toFixed(2)} ms`);
  console.log(`  Min Latency    : ${latencies[0].toFixed(2)} ms`);
  console.log(`  Max Latency    : ${latencies[NUM_RUNS - 1].toFixed(2)} ms`);
  console.log(`==================================================\n`);
}

runBenchmark().catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
