import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const SALT_ROUNDS = 12;

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, role: user.role, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────
// Students can self-register. ADMIN role creation is intentionally blocked here;
// admin accounts are provisioned only via the seed script.
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  // --- Validation ---
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // Block ADMIN self-signup — admins are provisioned via seed only
  if (role && role.toUpperCase() === 'ADMIN') {
    return res.status(403).json({ error: 'Cannot self-register as ADMIN. Contact the organizer.' });
  }

  // Default role is STUDENT; reject any other unrecognised roles
  const allowedRoles = ['STUDENT'];
  const assignedRole = (role && allowedRoles.includes(role.toUpperCase()))
    ? role.toUpperCase()
    : 'STUDENT';

  try {
    // Check username uniqueness
    const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        role: assignedRole,
      },
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({ token, role: user.role, username: user.username });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
