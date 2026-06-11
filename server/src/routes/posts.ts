import { Router, Response } from 'express';
import db from '../db';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// GET /api/posts - feed
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const posts = db.prepare(`
      SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as comment_count
      FROM posts p JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    // If user is logged in, mark which posts they liked
    if (req.userId) {
      const likedPosts = db.prepare('SELECT post_id FROM post_likes WHERE user_id = ?').all(req.userId) as { post_id: number }[];
      const likedSet = new Set(likedPosts.map(l => l.post_id));
      (posts as any[]).forEach(p => { p.liked = likedSet.has(p.id); });
    }

    res.json(posts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/user/:userId - user posts
router.get('/user/:userId', (req: AuthRequest, res: Response) => {
  try {
    const posts = db.prepare(`
      SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as comment_count
      FROM posts p JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).all(req.params.userId);

    res.json(posts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { content, activity_id, distance_km, duration_minutes, image_url } = req.body;
    if (!content) {
      return res.status(400).json({ error: '请输入动态内容' });
    }

    const result = db.prepare(
      'INSERT INTO posts (user_id, activity_id, content, distance_km, duration_minutes, image_url) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.userId, activity_id || null, content, distance_km || 0, duration_minutes || 0, image_url || '');

    // Update user total_km
    if (distance_km && distance_km > 0) {
      db.prepare('UPDATE users SET total_km = total_km + ? WHERE id = ?').run(distance_km, req.userId);
    }

    res.json({ id: result.lastInsertRowid, message: '发布成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:id/like
router.post('/:id/like', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const existing = db.prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?')
      .get(req.params.id, req.userId);
    if (existing) {
      db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(req.params.id, req.userId);
      res.json({ liked: false });
    } else {
      db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(req.params.id, req.userId);
      res.json({ liked: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/:id/comments
router.get('/:id/comments', (req: AuthRequest, res: Response) => {
  try {
    const comments = db.prepare(`
      SELECT pc.*, u.username, u.avatar_url
      FROM post_comments pc JOIN users u ON pc.user_id = u.id
      WHERE pc.post_id = ?
      ORDER BY pc.created_at ASC
    `).all(req.params.id);
    res.json(comments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:id/comments
router.post('/:id/comments', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: '请输入评论内容' });
    }

    const result = db.prepare('INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)')
      .run(req.params.id, req.userId, content);

    res.json({ id: result.lastInsertRowid, message: '评论成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
