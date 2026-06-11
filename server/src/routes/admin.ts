import { Router, Response } from 'express';
import db from '../db';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// GET /api/admin/stats
router.get('/stats', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const clubs = db.prepare('SELECT COUNT(*) as count FROM clubs').get() as { count: number };
    const pendingClubs = db.prepare("SELECT COUNT(*) as count FROM clubs WHERE status = 'pending'").get() as { count: number };
    const posts = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number };
    const activities = db.prepare('SELECT COUNT(*) as count FROM activities').get() as { count: number };
    const reports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").get() as { count: number };

    res.json({
      totalUsers: users.count,
      totalClubs: clubs.count,
      pendingClubs: pendingClubs.count,
      totalPosts: posts.count,
      totalActivities: activities.count,
      pendingReports: reports.count,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/clubs/pending
router.get('/clubs/pending', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const clubs = db.prepare(`
      SELECT c.*, u.username as owner_name
      FROM clubs c JOIN users u ON c.owner_id = u.id
      WHERE c.status = 'pending'
      ORDER BY c.created_at DESC
    `).all();
    res.json(clubs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/clubs/:id/approve
router.put('/clubs/:id/approve', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    db.prepare("UPDATE clubs SET status = 'approved' WHERE id = ?").run(req.params.id);
    res.json({ message: '已通过审核' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/clubs/:id/reject
router.put('/clubs/:id/reject', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    db.prepare("UPDATE clubs SET status = 'rejected' WHERE id = ?").run(req.params.id);
    res.json({ message: '已拒绝' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/reports
router.get('/reports', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const reports = db.prepare(`
      SELECT r.*, u.username as reporter_name
      FROM reports r JOIN users u ON r.reporter_id = u.id
      ORDER BY r.created_at DESC
    `).all();
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/reports/:id/resolve
router.put('/reports/:id/resolve', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    db.prepare("UPDATE reports SET status = 'resolved' WHERE id = ?").run(req.params.id);
    res.json({ message: '已处理' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/posts/:id - delete post
router.delete('/posts/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM post_likes WHERE post_id = ?').run(req.params.id);
    db.prepare('DELETE FROM post_comments WHERE post_id = ?').run(req.params.id);
    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    res.json({ message: '已删除' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/reports - create report (any logged-in user)
router.post('/reports', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { target_type, target_id, reason } = req.body;
    if (!target_type || !target_id || !reason) {
      return res.status(400).json({ error: '请填写举报信息' });
    }
    db.prepare('INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)')
      .run(req.userId, target_type, target_id, reason);
    res.json({ message: '举报已提交' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
