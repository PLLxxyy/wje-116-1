import { Router, Response } from 'express';
import db from '../db';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, Activity } from '../types';

const router = Router();

// GET /api/activities/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const activity = db.prepare(`
      SELECT a.*, u.username as creator_name, c.name as club_name
      FROM activities a
      JOIN users u ON a.creator_id = u.id
      JOIN clubs c ON a.club_id = c.id
      WHERE a.id = ?
    `).get(req.params.id) as any;

    if (!activity) {
      return res.status(404).json({ error: '活动不存在' });
    }

    const participants = db.prepare(`
      SELECT ap.status, u.id as user_id, u.username, u.avatar_url
      FROM activity_participants ap JOIN users u ON ap.user_id = u.id
      WHERE ap.activity_id = ? AND ap.status = 'going'
    `).all(req.params.id);

    const posts = db.prepare(`
      SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as comment_count
      FROM posts p JOIN users u ON p.user_id = u.id
      WHERE p.activity_id = ?
      ORDER BY p.created_at DESC
    `).all(req.params.id) as any[];

    // Attach comments to each post
    const commentStmt = db.prepare(`
      SELECT pc.*, u.username FROM post_comments pc JOIN users u ON pc.user_id = u.id WHERE pc.post_id = ? ORDER BY pc.created_at ASC
    `);
    for (const post of posts) {
      (post as any).comments = commentStmt.all(post.id);
    }

    let isJoined = false;
    if (req.userId) {
      const participation = db.prepare('SELECT id FROM activity_participants WHERE activity_id = ? AND user_id = ? AND status = ?')
        .get(req.params.id, req.userId, 'going');
      isJoined = !!participation;
    }

    res.json({ ...activity, participants, posts, isJoined, participantCount: participants.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/activities - create activity (club owner/admin)
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { club_id, title, description, location, route, datetime, pace, max_participants } = req.body;
    if (!club_id || !title || !datetime) {
      return res.status(400).json({ error: '请填写活动标题和时间' });
    }

    // Check if user is owner or admin of the club
    const membership = db.prepare('SELECT role FROM club_members WHERE club_id = ? AND user_id = ?')
      .get(club_id, req.userId) as { role: string } | undefined;
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return res.status(403).json({ error: '只有团长和管理员可以发起活动' });
    }

    const result = db.prepare(
      'INSERT INTO activities (club_id, creator_id, title, description, location, route, datetime, pace, max_participants) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(club_id, req.userId, title, description || '', location || '', route || '', datetime, pace || '', max_participants || 50);

    // Auto-join creator
    db.prepare('INSERT INTO activity_participants (activity_id, user_id, status) VALUES (?, ?, ?)')
      .run(result.lastInsertRowid, req.userId, 'going');

    res.json({ id: result.lastInsertRowid, message: '活动创建成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/activities/:id/join
router.post('/:id/join', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id) as Activity | undefined;
    if (!activity) {
      return res.status(404).json({ error: '活动不存在' });
    }

    // Check club membership
    const membership = db.prepare('SELECT id FROM club_members WHERE club_id = ? AND user_id = ?')
      .get(activity.club_id, req.userId);
    if (!membership) {
      return res.status(403).json({ error: '请先加入跑团' });
    }

    const existing = db.prepare('SELECT id, status FROM activity_participants WHERE activity_id = ? AND user_id = ?')
      .get(req.params.id, req.userId) as any;
    if (existing && existing.status === 'going') {
      return res.status(400).json({ error: '已经报名了' });
    }

    // Check capacity
    const count = db.prepare('SELECT COUNT(*) as cnt FROM activity_participants WHERE activity_id = ? AND status = ?')
      .get(req.params.id, 'going') as { cnt: number };
    if (count.cnt >= activity.max_participants) {
      return res.status(400).json({ error: '报名人数已满' });
    }

    if (existing) {
      db.prepare('UPDATE activity_participants SET status = ? WHERE activity_id = ? AND user_id = ?')
        .run('going', req.params.id, req.userId);
    } else {
      db.prepare('INSERT INTO activity_participants (activity_id, user_id, status) VALUES (?, ?, ?)')
        .run(req.params.id, req.userId, 'going');
    }

    res.json({ message: '报名成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/activities/:id/cancel
router.post('/:id/cancel', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    db.prepare('UPDATE activity_participants SET status = ? WHERE activity_id = ? AND user_id = ?')
      .run('cancelled', req.params.id, req.userId);
    res.json({ message: '已取消报名' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
