import { Router, Response } from 'express';
import db from '../db';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, Challenge } from '../types';

const router = Router();

// GET /api/challenges
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const challenges = db.prepare(`
      SELECT ch.*,
        ca.name as club_a_name, ca.member_count as club_a_members,
        cb.name as club_b_name, cb.member_count as club_b_members,
        COALESCE(SUM(CASE WHEN pcm_a.user_id IS NOT NULL THEN pcm_a.distance_km ELSE 0 END), 0) as club_a_km,
        COALESCE(SUM(CASE WHEN pcm_b.user_id IS NOT NULL THEN pcm_b.distance_km ELSE 0 END), 0) as club_b_km
      FROM challenges ch
      JOIN clubs ca ON ch.club_a_id = ca.id
      JOIN clubs cb ON ch.club_b_id = cb.id
      LEFT JOIN club_members cma ON cma.club_id = ca.id
      LEFT JOIN posts pcm_a ON pcm_a.user_id = cma.user_id
        AND pcm_a.created_at >= ch.month || '-01'
        AND pcm_a.created_at < date(ch.month || '-01', '+1 month')
      LEFT JOIN club_members cmb ON cmb.club_id = cb.id
      LEFT JOIN posts pcm_b ON pcm_b.user_id = cmb.user_id
        AND pcm_b.created_at >= ch.month || '-01'
        AND pcm_b.created_at < date(ch.month || '-01', '+1 month')
      GROUP BY ch.id
      ORDER BY ch.created_at DESC
    `).all();

    res.json(challenges);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/challenges - create challenge (club owner)
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { club_b_id, month } = req.body;
    if (!club_b_id || !month) {
      return res.status(400).json({ error: '请选择挑战对手和月份' });
    }

    // Find user's owned club
    const myClub = db.prepare("SELECT id FROM clubs WHERE owner_id = ? AND status = 'approved'").get(req.userId) as { id: number } | undefined;
    if (!myClub) {
      return res.status(403).json({ error: '只有团长可以发起挑战' });
    }

    if (myClub.id === club_b_id) {
      return res.status(400).json({ error: '不能挑战自己的跑团' });
    }

    const existing = db.prepare('SELECT id FROM challenges WHERE club_a_id = ? AND club_b_id = ? AND month = ?')
      .get(myClub.id, club_b_id, month);
    if (existing) {
      return res.status(400).json({ error: '该月已有挑战' });
    }

    const result = db.prepare('INSERT INTO challenges (club_a_id, club_b_id, month, status) VALUES (?, ?, ?, ?)')
      .run(myClub.id, club_b_id, month, 'active');

    res.json({ id: result.lastInsertRowid, message: '挑战发起成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
