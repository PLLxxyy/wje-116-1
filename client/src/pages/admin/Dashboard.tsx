import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

interface Stats {
  totalUsers: number;
  totalClubs: number;
  pendingClubs: number;
  totalPosts: number;
  totalActivities: number;
  pendingReports: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await api.get<Stats>('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>;
  if (!stats) return <div style={{ textAlign: 'center', padding: 40 }}>加载失败</div>;

  const cards = [
    { label: '总用户数', value: stats.totalUsers, color: '#1a73e8' },
    { label: '跑团总数', value: stats.totalClubs, color: '#34a853' },
    { label: '待审核跑团', value: stats.pendingClubs, color: '#fbbc04', link: '/admin/club-review' },
    { label: '动态总数', value: stats.totalPosts, color: '#9c27b0' },
    { label: '活动总数', value: stats.totalActivities, color: '#ff6d00' },
    { label: '待处理举报', value: stats.pendingReports, color: '#ea4335', link: '/admin/content-review' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>管理后台</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {cards.map(card => (
          <div key={card.label} className="card" style={{ textAlign: 'center', borderLeft: `4px solid ${card.color}` }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 14, color: '#666' }}>{card.label}</div>
            {card.link && card.value > 0 && (
              <Link to={card.link} style={{ fontSize: 13, display: 'inline-block', marginTop: 8 }}>去处理 →</Link>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <Link to="/admin/club-review" className="card" style={{
          flex: 1, textDecoration: 'none', color: 'inherit', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <span style={{ fontSize: 16 }}>📋 跑团审核</span>
        </Link>
        <Link to="/admin/content-review" className="card" style={{
          flex: 1, textDecoration: 'none', color: 'inherit', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <span style={{ fontSize: 16 }}>🔍 内容审核</span>
        </Link>
      </div>
    </div>
  );
}
