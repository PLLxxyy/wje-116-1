import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'running-club.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      avatar_url TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      total_km REAL DEFAULT 0,
      best_marathon_time TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clubs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      owner_id INTEGER NOT NULL,
      city TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      member_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS club_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (club_id) REFERENCES clubs(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(club_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      creator_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      location TEXT DEFAULT '',
      route TEXT DEFAULT '',
      datetime TEXT NOT NULL,
      pace TEXT DEFAULT '',
      max_participants INTEGER DEFAULT 50,
      status TEXT NOT NULL DEFAULT 'upcoming',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (club_id) REFERENCES clubs(id),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activity_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'going',
      FOREIGN KEY (activity_id) REFERENCES activities(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(activity_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      activity_id INTEGER,
      content TEXT NOT NULL,
      distance_km REAL DEFAULT 0,
      duration_minutes INTEGER DEFAULT 0,
      image_url TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (activity_id) REFERENCES activities(id)
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_a_id INTEGER NOT NULL,
      club_b_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      winner_club_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (club_a_id) REFERENCES clubs(id),
      FOREIGN KEY (club_b_id) REFERENCES clubs(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (reporter_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS medals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_name TEXT NOT NULL,
      year INTEGER NOT NULL,
      medal_type TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  seedData();
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);

  const insertUser = db.prepare(
    'INSERT INTO users (username, email, password_hash, role, avatar_url, bio, total_km, best_marathon_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  insertUser.run('admin', 'admin@running.com', hash('admin123'), 'admin', '', '平台管理员', 0, '');
  insertUser.run('张伟', 'zhangwei@test.com', hash('123456'), 'user', '', '跑步爱好者，坚持跑步3年', 1280.5, '3:25:00');
  insertUser.run('李娜', 'lina@test.com', hash('123456'), 'user', '', '马拉松跑者，正在备战全马', 860.2, '3:48:00');
  insertUser.run('王强', 'wangqiang@test.com', hash('123456'), 'user', '', '越野跑爱好者', 2100.8, '3:10:00');
  insertUser.run('陈静', 'chenjing@test.com', hash('123456'), 'user', '', '晨跑打卡第500天', 650.3, '');

  const insertClub = db.prepare(
    'INSERT INTO clubs (name, description, owner_id, city, status, member_count) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertClub.run('朝阳跑团', '北京朝阳区最活跃的跑团，每周三、周六固定约跑', 2, '北京', 'approved', 4);
  insertClub.run('西湖夜跑', '杭州西湖边夜跑，风景最美路线', 4, '杭州', 'approved', 2);
  insertClub.run('浦东晨跑俱乐部', '浦东新区晨跑爱好者集合', 3, '上海', 'pending', 1);

  const insertMember = db.prepare(
    'INSERT INTO club_members (club_id, user_id, role) VALUES (?, ?, ?)'
  );
  insertMember.run(1, 2, 'owner');
  insertMember.run(1, 3, 'admin');
  insertMember.run(1, 4, 'member');
  insertMember.run(1, 5, 'member');
  insertMember.run(2, 4, 'owner');
  insertMember.run(2, 5, 'member');
  insertMember.run(3, 3, 'owner');

  const insertActivity = db.prepare(
    'INSERT INTO activities (club_id, creator_id, title, description, location, route, datetime, pace, max_participants, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  insertActivity.run(1, 2, '周六奥森约跑', '本周六早上7点，奥森公园南门集合，10公里慢跑', '奥森公园南门', '南门→跑道→北门→折返', '2026-06-14 07:00', '5:30-6:00', 30, 'upcoming');
  insertActivity.run(1, 2, '周三夜跑CBD', '下班后一起跑CBD，缓解工作压力', '国贸地铁站C口', '国贸→长安街→大望路→返回', '2026-06-11 19:30', '5:00-5:30', 20, 'upcoming');
  insertActivity.run(2, 4, '西湖环湖跑', '周末环西湖一圈，约15公里', '断桥残雪', '断桥→白堤→苏堤→雷峰塔→湖滨→断桥', '2026-06-15 06:30', '5:45-6:15', 25, 'upcoming');

  db.prepare('INSERT INTO activity_participants (activity_id, user_id, status) VALUES (?, ?, ?)').run(1, 3, 'going');
  db.prepare('INSERT INTO activity_participants (activity_id, user_id, status) VALUES (?, ?, ?)').run(1, 4, 'going');
  db.prepare('INSERT INTO activity_participants (activity_id, user_id, status) VALUES (?, ?, ?)').run(2, 3, 'going');

  const insertPost = db.prepare(
    'INSERT INTO posts (user_id, activity_id, content, distance_km, duration_minutes, image_url) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertPost.run(2, null, '今天晨跑10公里，天气不错！配速稳定在5分半，感觉状态越来越好。坚持跑步真的会上瘾。', 10.0, 55, '');
  insertPost.run(3, null, '完成了一次半马训练，虽然最后几公里很辛苦，但坚持下来了！下周继续加油💪', 21.1, 118, '');
  insertPost.run(4, null, '山地越野15公里，爬升500米，风景太美了！越野跑和路跑完全是两种体验。', 15.0, 95, '');
  insertPost.run(5, null, '晨跑打卡第500天🎉 从第一天的3公里都跑不下来，到现在轻松10公里，感谢跑步改变生活。', 8.0, 48, '');

  db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(1, 3);
  db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(1, 4);
  db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(2, 2);
  db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(2, 5);

  db.prepare('INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)').run(1, 3, '状态真好！一起加油！');
  db.prepare('INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)').run(2, 4, '半马辛苦了，休息好再练！');

  db.prepare('INSERT INTO challenges (club_a_id, club_b_id, month, status) VALUES (?, ?, ?, ?)').run(1, 2, '2026-06', 'active');

  db.prepare('INSERT INTO medals (user_id, event_name, year, medal_type) VALUES (?, ?, ?, ?)').run(2, '北京马拉松', 2025, '全马完赛');
  db.prepare('INSERT INTO medals (user_id, event_name, year, medal_type) VALUES (?, ?, ?, ?)').run(2, '厦门马拉松', 2024, '全马完赛');
  db.prepare('INSERT INTO medals (user_id, event_name, year, medal_type) VALUES (?, ?, ?, ?)').run(3, '上海半程马拉松', 2025, '半马完赛');
  db.prepare('INSERT INTO medals (user_id, event_name, year, medal_type) VALUES (?, ?, ?, ?)').run(4, '崇礼越野赛', 2025, '50公里越野');
  db.prepare('INSERT INTO medals (user_id, event_name, year, medal_type) VALUES (?, ?, ?, ?)').run(4, '杭州马拉松', 2025, '全马完赛');
  db.prepare('INSERT INTO medals (user_id, event_name, year, medal_type) VALUES (?, ?, ?, ?)').run(4, 'UTMB环勃朗峰', 2024, '100公里越野');
}

initDB();

export default db;
