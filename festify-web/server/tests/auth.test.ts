/**
 * Auth — Integration Test Suite
 *
 * Tests:
 *   1.  POST /register — successful student signup returns { token, role, username }
 *   2.  POST /register — duplicate username returns 409
 *   3.  POST /register — ADMIN role is blocked with 403
 *   4.  POST /register — short password (< 8 chars) returns 400
 *   5.  POST /login    — correct password succeeds (user created via signup path)
 *   6.  POST /login    — wrong password returns 401
 *   7.  POST /login    — seeded user with bcrypt-hashed password succeeds
 *   8.  authenticateJWT middleware — valid token from signup passes through
 *   9.  requireAdmin middleware    — STUDENT token is rejected with 403
 *   10. requireAdmin middleware    — ADMIN token is accepted
 *
 * Run with: npx tsx server/auth.test.ts
 */

import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import authRoutes from '../routes/auth.js';
import { authenticateJWT, requireAdmin } from '../middleware/auth.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// A protected route to test authenticateJWT
app.get('/api/protected', authenticateJWT, (req: any, res) => {
  res.json({ ok: true, user: req.user });
});

// An admin-only route to test requireAdmin
app.get('/api/admin-only', authenticateJWT, requireAdmin, (req: any, res) => {
  res.json({ ok: true, user: req.user });
});

let server: http.Server;
let baseUrl: string;

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────
async function post(path: string, body: any, token?: string) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function get(path: string, token?: string) {
  return fetch(`${baseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// ─── Test Runner ─────────────────────────────────────────────────────────────
async function runTests() {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as any;
      baseUrl = `http://localhost:${addr.port}`;
      console.log(`\n🧪 Auth Test server running on port ${addr.port}\n`);
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

  // Unique suffix so tests can run repeatedly without collisions
  const suffix = Date.now();
  const testUsername = `testuser_${suffix}`;
  const testPassword = 'SecurePass123!';

  try {
    // ─── Cleanup any leftover test users from a prior run ───────────────────
    await prisma.user.deleteMany({
      where: { username: { startsWith: 'testuser_' } },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1: Successful signup
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n  📋 Testing POST /api/auth/register...');
    const signupRes = await post('/api/auth/register', {
      username: testUsername,
      password: testPassword,
    });
    const signupData = await signupRes.json();

    assert(signupRes.status === 201, `Signup returns 201 (got ${signupRes.status})`);
    assert(typeof signupData.token === 'string' && signupData.token.length > 0, 'Signup returns a token');
    assert(signupData.role === 'STUDENT', `Signup assigns STUDENT role (got ${signupData.role})`);
    assert(signupData.username === testUsername, 'Signup returns correct username');

    // Verify the token is a valid JWT
    const signupPayload = jwt.verify(signupData.token, JWT_SECRET) as any;
    assert(signupPayload.username === testUsername, 'JWT payload contains correct username');
    assert(signupPayload.role === 'STUDENT', 'JWT payload contains STUDENT role');

    // Verify the password is actually bcrypt-hashed in the DB
    const createdUser = await prisma.user.findUnique({ where: { username: testUsername } });
    assert(!!createdUser, 'User was created in database');
    assert(
      !!createdUser && createdUser.password.startsWith('$2'),
      'Password is stored as bcrypt hash (starts with $2)'
    );
    const hashIsValid = createdUser
      ? await bcrypt.compare(testPassword, createdUser.password)
      : false;
    assert(hashIsValid, 'Stored bcrypt hash correctly verifies against original password');

    // ─────────────────────────────────────────────────────────────────────────
    // Test 2: Duplicate username returns 409
    // ─────────────────────────────────────────────────────────────────────────
    const dupRes = await post('/api/auth/register', {
      username: testUsername,
      password: testPassword,
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409, `Duplicate username returns 409 (got ${dupRes.status})`);
    assert(typeof dupData.error === 'string', 'Duplicate username returns error message');

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3: ADMIN role is blocked
    // ─────────────────────────────────────────────────────────────────────────
    const adminSelfSignupRes = await post('/api/auth/register', {
      username: `admin_attempt_${suffix}`,
      password: 'SecurePass123!',
      role: 'ADMIN',
    });
    const adminSelfSignupData = await adminSelfSignupRes.json();
    assert(
      adminSelfSignupRes.status === 403,
      `ADMIN self-signup is blocked with 403 (got ${adminSelfSignupRes.status})`
    );
    assert(typeof adminSelfSignupData.error === 'string', 'ADMIN block returns error message');

    // ─────────────────────────────────────────────────────────────────────────
    // Test 4: Short password is rejected
    // ─────────────────────────────────────────────────────────────────────────
    const shortPwRes = await post('/api/auth/register', {
      username: `shortpw_${suffix}`,
      password: 'abc',
    });
    const shortPwData = await shortPwRes.json();
    assert(
      shortPwRes.status === 400,
      `Short password returns 400 (got ${shortPwRes.status})`
    );
    assert(typeof shortPwData.error === 'string', 'Short password returns error message');

    // ─────────────────────────────────────────────────────────────────────────
    // Test 5: Login with correct password (user created via signup)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n  📋 Testing POST /api/auth/login...');
    const loginRes = await post('/api/auth/login', {
      username: testUsername,
      password: testPassword,
    });
    const loginData = await loginRes.json();

    assert(loginRes.status === 200, `Login with correct password returns 200 (got ${loginRes.status})`);
    assert(typeof loginData.token === 'string', 'Login returns a token');
    assert(loginData.role === 'STUDENT', 'Login returns correct role');
    assert(loginData.username === testUsername, 'Login returns correct username');

    const loginPayload = jwt.verify(loginData.token, JWT_SECRET) as any;
    assert(loginPayload.username === testUsername, 'Login JWT contains correct username');

    // ─────────────────────────────────────────────────────────────────────────
    // Test 6: Login with wrong password returns 401
    // ─────────────────────────────────────────────────────────────────────────
    const wrongPwRes = await post('/api/auth/login', {
      username: testUsername,
      password: 'WrongPassword999!',
    });
    const wrongPwData = await wrongPwRes.json();
    assert(
      wrongPwRes.status === 401,
      `Wrong password returns 401 (got ${wrongPwRes.status})`
    );
    assert(typeof wrongPwData.error === 'string', 'Wrong password returns error message');

    // ─────────────────────────────────────────────────────────────────────────
    // Test 7: Seeded user (bcrypt-hashed in DB) can log in
    // ─────────────────────────────────────────────────────────────────────────
    // Create a "seeded" user with a bcrypt-hashed password directly (simulating
    // what the updated seed.ts does)
    const seededHashedPw = await bcrypt.hash('password', 12);
    const seededUsername = `seeded_user_${suffix}`;
    await prisma.user.create({
      data: { username: seededUsername, password: seededHashedPw, role: 'STUDENT' },
    });

    const seededLoginRes = await post('/api/auth/login', {
      username: seededUsername,
      password: 'password',
    });
    const seededLoginData = await seededLoginRes.json();
    assert(
      seededLoginRes.status === 200,
      `Seeded bcrypt-hashed user can log in (got ${seededLoginRes.status})`
    );
    assert(typeof seededLoginData.token === 'string', 'Seeded user login returns a token');

    // ─────────────────────────────────────────────────────────────────────────
    // Test 8: authenticateJWT — valid token from signup passes through
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n  📋 Testing middleware...');
    const protectedRes = await get('/api/protected', signupData.token);
    const protectedData = await protectedRes.json();
    assert(
      protectedRes.status === 200 && protectedData.ok === true,
      `authenticateJWT accepts valid token from signup (got ${protectedRes.status})`
    );
    assert(
      protectedData.user?.username === testUsername,
      'authenticateJWT populates req.user with correct username'
    );

    // Also test that no token → 401
    const noTokenRes = await get('/api/protected');
    assert(
      noTokenRes.status === 401,
      `authenticateJWT rejects missing token with 401 (got ${noTokenRes.status})`
    );

    // And that a garbled token → 403
    const badTokenRes = await get('/api/protected', 'this.is.garbage');
    assert(
      badTokenRes.status === 403,
      `authenticateJWT rejects invalid token with 403 (got ${badTokenRes.status})`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Test 9: requireAdmin — STUDENT token is rejected
    // ─────────────────────────────────────────────────────────────────────────
    const studentAdminRes = await get('/api/admin-only', signupData.token);
    assert(
      studentAdminRes.status === 403,
      `requireAdmin rejects STUDENT token with 403 (got ${studentAdminRes.status})`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Test 10: requireAdmin — ADMIN token is accepted
    // ─────────────────────────────────────────────────────────────────────────
    // Create an admin token signed with the same secret (simulating what login returns)
    const adminToken = jwt.sign(
      { id: 9999, username: 'test_admin', role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const adminOnlyRes = await get('/api/admin-only', adminToken);
    const adminOnlyData = await adminOnlyRes.json();
    assert(
      adminOnlyRes.status === 200 && adminOnlyData.ok === true,
      `requireAdmin accepts ADMIN token with 200 (got ${adminOnlyRes.status})`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Cleanup test users
    // ─────────────────────────────────────────────────────────────────────────
    await prisma.user.deleteMany({
      where: { username: { startsWith: 'testuser_' } },
    });
    await prisma.user.deleteMany({
      where: { username: { startsWith: 'seeded_user_' } },
    });

  } catch (err) {
    console.error('\nTest execution error:', err);
    failed++;
  } finally {
    server.close();
    await prisma.$disconnect();
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  if (failed === 0) {
    console.log('🎉 All auth tests passed!\n');
  } else {
    process.exit(1);
  }
}

runTests();
