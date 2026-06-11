import { Router, Response } from 'express';
import db from '../db';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, Club, ClubMember, User } from '../types';

const router = Router();

// GET /api/clubs - list approved clubs
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const clubs = db.prepare(`
      SELECT c.*, u.username as owner_name
      FROM clubs c JOIN users u ON c.owner_id = u.id
      WHERE c.status = 'approved'
      ORDER BY c.member_count DESC
    `).all();
    res.json(clubs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clubs/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const club = db.prepare(`
      SELECT c.*, u.username as owner_name
      FROM clubs c JOIN users u ON c.owner_id = u.id
      WHERE c.id = ?
    `).get(req.params.id) as (Club & { owner_name: string }) | undefined;

    if (!club) {
      return res.status(404).json({ error: '跑团不存在' });
    }

    const members = db.prepare(`
      SELECT cm.role, cm.joined_at, u.id as user_id, u.username, u.avatar_url, u.total_km
      FROM club_members cm JOIN users u ON cm.user_id = u.id
      WHERE cm.club_id = ?
      ORDER BY cm.role = 'owner' DESC, cm.role = 'admin' DESC, u.total_km DESC
    `).all(req.params.id);

    const weeklyRanking = db.prepare(`
      SELECT u.id, u.username, u.avatar_url, COALESCE(SUM(p.distance_km), 0) as weekly_km
      FROM club_members cm
      JOIN users u ON cm.user_id = u.id
      LEFT JOIN posts p ON p.user_id = u.id AND p.created_at >= datetime('now', '-7 days')
      WHERE cm.club_id = ?
      GROUP BY u.id
      ORDER BY weekly_km DESC
    `).all(req.params.id);

    const activities = db.prepare(`
      SELECT a.*, u.username as creator_name,
        (SELECT COUNT(*) FROM activity_participants ap WHERE ap.activity_id = a.id AND ap.status = 'going') as participant_count
      FROM activities a JOIN users u ON a.creator_id = u.id
      WHERE a.club_id = ?
      ORDER BY a.datetime DESC
    `).all(req.params.id);

    // Check if current user is a member
    let isMember = false;
    let memberRole = null;
    if (req.userId) {
      const membership = db.prepare('SELECT role FROM club_members WHERE club_id = ? AND user_id = ?')
        .get(req.params.id, req.userId) as ClubMember | undefined;
      if (membership) {
        isMember = true;
        memberRole = membership.role;
      }
    }

    res.json({ ...club, members, weeklyRanking, activities, isMember, memberRole });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clubs - create club
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name, description, city } = req.body;
    if (!name) {
      return res.status(400).json({ error: '请输入跑团名称' });
    }

    const result = db.prepare(
      'INSERT INTO clubs (name, description, owner_id, city, status, member_count) VALUES (?, ?, ?, ?, ?, 1)'
    ).run(name, description || '', req.userId, city || '', 'pending');

    const clubId = result.lastInsertRowid as number;
    db.prepare('INSERT INTO club_members (club_id, user_id, role) VALUES (?, ?, ?)').run(clubId, req.userId, 'owner');

    res.json({ id: clubId, message: '跑团创建成功，等待审核' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clubs/:id/join
router.post('/:id/join', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const club = db.prepare('SELECT * FROM clubs WHERE id = ? AND status = ?').get(req.params.id, 'approved') as Club | undefined;
    if (!club) {
      return res.status(404).json({ error: '跑团不存在或未通过审核' });
    }

    const existing = db.prepare('SELECT id FROM club_members WHERE club_id = ? AND user_id = ?')
      .get(req.params.id, req.userId);
    if (existing) {
      return res.status(400).json({ error: '已经是跑团成员' });
    }

    db.prepare('INSERT INTO club_members (club_id, user_id, role) VALUES (?, ?, ?)').run(req.params.id, req.userId, 'member');
    db.prepare('UPDATE clubs SET member_count = member_count + 1 WHERE id = ?').run(req.params.id);

    res.json({ message: '加入成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clubs/:id/leave
router.post('/:id/leave', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const membership = db.prepare('SELECT * FROM club_members WHERE club_id = ? AND user_id = ?')
      .get(req.params.id, req.userId) as ClubMember | undefined;
    if (!membership) {
      return res.status(400).json({ error: '不是跑团成员' });
    }
    if (membership.role === 'owner') {
      return res.status(400).json({ error: '团长不能退出跑团' });
    }

    db.prepare('DELETE FROM club_members WHERE club_id = ? AND user_id = ?').run(req.params.id, req.userId);
    db.prepare('UPDATE clubs SET member_count = member_count - 1 WHERE id = ?').run(req.params.id);

    res.json({ message: '已退出跑团' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
