import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { generateToken, authMiddleware } from '../middleware/auth';
import { AuthRequest, User } from '../types';

const router = Router();

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return res.status(400).json({ error: '用户名或邮箱已被注册' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(username, email, password_hash);

    const token = generateToken(result.lastInsertRowid as number, 'user');
    res.json({ token, user: { id: result.lastInsertRowid, username, email, role: 'user' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '请填写用户名和密码' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = generateToken(user.id, user.role);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        bio: user.bio,
        total_km: user.total_km,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT id, username, email, role, avatar_url, bio, total_km, best_marathon_time, created_at FROM users WHERE id = ?').get(req.userId) as User;
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { bio, avatar_url } = req.body;
    db.prepare('UPDATE users SET bio = COALESCE(?, bio), avatar_url = COALESCE(?, avatar_url) WHERE id = ?')
      .run(bio, avatar_url, req.userId);
    const user = db.prepare('SELECT id, username, email, role, avatar_url, bio, total_km, best_marathon_time, created_at FROM users WHERE id = ?').get(req.userId);
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users/:id - public user profile
router.get('/users/:id', (req: Request, res: Response) => {
  try {
    const user = db.prepare(
      'SELECT id, username, avatar_url, bio, total_km, best_marathon_time, created_at FROM users WHERE id = ?'
    ).get(req.params.id) as User | undefined;
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users/:id/medals
router.get('/users/:id/medals', (req: Request, res: Response) => {
  try {
    const medals = db.prepare(
      'SELECT * FROM medals WHERE user_id = ? ORDER BY year DESC'
    ).all(req.params.id);
    res.json(medals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
