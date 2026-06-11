import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import ActivityCard from '../components/ActivityCard';
import WeeklyRanking from '../components/WeeklyRanking';

interface ClubDetail {
  id: number;
  name: string;
  description: string;
  city: string;
  owner_name: string;
  owner_id: number;
  member_count: number;
  status: string;
  isMember: boolean;
  memberRole: string | null;
  members: Array<{ user_id: number; username: string; role: string; total_km: number; joined_at: string }>;
  weeklyRanking: Array<{ id: number; username: string; weekly_km: number }>;
  activities: Array<any>;
}

export default function ClubDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateActivity, setShowCreateActivity] = useState(false);

  // Activity form
  const [actTitle, setActTitle] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actLocation, setActLocation] = useState('');
  const [actRoute, setActRoute] = useState('');
  const [actDatetime, setActDatetime] = useState('');
  const [actPace, setActPace] = useState('');
  const [actMax, setActMax] = useState('30');

  useEffect(() => {
    loadClub();
  }, [id]);

  async function loadClub() {
    try {
      const data = await api.get<ClubDetail>(`/clubs/${id}`);
      setClub(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    try {
      await api.post(`/clubs/${id}/join`);
      loadClub();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleLeave() {
    if (!confirm('确定要退出跑团吗？')) return;
    try {
      await api.post(`/clubs/${id}/leave`);
      loadClub();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleCreateActivity(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/activities', {
        club_id: parseInt(id!),
        title: actTitle,
        description: actDesc,
        location: actLocation,
        route: actRoute,
        datetime: actDatetime,
        pace: actPace,
        max_participants: parseInt(actMax) || 30,
      });
      alert('活动创建成功');
      setShowCreateActivity(false);
      setActTitle('');
      setActDesc('');
      setActLocation('');
      setActRoute('');
      setActDatetime('');
      setActPace('');
      setActMax('30');
      loadClub();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>;
  if (!club) return <div style={{ textAlign: 'center', padding: 40 }}>跑团不存在</div>;

  const isOwnerOrAdmin = club.memberRole === 'owner' || club.memberRole === 'admin';

  return (
    <div>
      {/* Club header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>{club.name}</h1>
            <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#666' }}>
              {club.city && <span>📍 {club.city}</span>}
              <span>👥 {club.member_count} 人</span>
              <span>团长: {club.owner_name}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {user && !club.isMember && (
              <button onClick={handleJoin} className="btn-primary">加入跑团</button>
            )}
            {user && club.isMember && club.memberRole !== 'owner' && (
              <button onClick={handleLeave} className="btn-outline">退出</button>
            )}
          </div>
        </div>
        <p style={{ color: '#666', lineHeight: 1.8 }}>{club.description}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Left column */}
        <div>
          {/* Activities */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2>约跑活动</h2>
              {isOwnerOrAdmin && (
                <button onClick={() => setShowCreateActivity(!showCreateActivity)} className="btn-primary btn-sm">
                  {showCreateActivity ? '取消' : '发起活动'}
                </button>
              )}
            </div>

            {showCreateActivity && (
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginBottom: 12 }}>发起约跑</h3>
                <form onSubmit={handleCreateActivity}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>活动标题 *</label>
                      <input value={actTitle} onChange={e => setActTitle(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>集合时间 *</label>
                      <input type="datetime-local" value={actDatetime} onChange={e => setActDatetime(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>集合地点</label>
                      <input value={actLocation} onChange={e => setActLocation(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>预计配速</label>
                      <input value={actPace} onChange={e => setActPace(e.target.value)} placeholder="5:30-6:00" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>路线</label>
                      <input value={actRoute} onChange={e => setActRoute(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>人数上限</label>
                      <input type="number" value={actMax} onChange={e => setActMax(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>活动描述</label>
                    <textarea value={actDesc} onChange={e => setActDesc(e.target.value)} rows={2} />
                  </div>
                  <button type="submit" className="btn-primary">创建活动</button>
                </form>
              </div>
            )}

            {club.activities.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#999' }}>暂无活动</div>
            ) : (
              club.activities.map((act: any) => <ActivityCard key={act.id} activity={act} />)
            )}
          </div>

          {/* Members */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>成员列表</h3>
            {club.members.map(member => (
              <div key={member.user_id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                borderBottom: '1px solid #f5f5f5', cursor: 'pointer',
              }}
                onClick={() => navigate(`/profile/${member.user_id}`)}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: '#e3f2fd',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600, color: '#1a73e8',
                }}>
                  {member.username[0]}
                </div>
                <span style={{ flex: 1, fontSize: 14 }}>{member.username}</span>
                {member.role === 'owner' && <span style={{ fontSize: 12, color: '#fbbc04', background: '#fef7e0', padding: '2px 6px', borderRadius: 4 }}>团长</span>}
                {member.role === 'admin' && <span style={{ fontSize: 12, color: '#1a73e8', background: '#e3f2fd', padding: '2px 6px', borderRadius: 4 }}>管理员</span>}
                <span style={{ fontSize: 12, color: '#999' }}>{member.total_km.toFixed(1)} km</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column - Weekly ranking */}
        <div>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>📊 本周跑量排行</h3>
            <WeeklyRanking ranking={club.weeklyRanking} />
          </div>
        </div>
      </div>
    </div>
  );
}
