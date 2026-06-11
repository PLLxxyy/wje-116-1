import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface ActivityData {
  id: number;
  club_id: number;
  title: string;
  description: string;
  location: string;
  route: string;
  datetime: string;
  pace: string;
  max_participants: number;
  status: string;
  creator_name: string;
  club_name: string;
  isJoined: boolean;
  participantCount: number;
  participants: Array<{ user_id: number; username: string }>;
  posts: Array<any>;
  isCheckedIn: boolean;
  checkinInfo: { id: number; distance_km: number; duration_minutes: number; checked_in_at: string } | null;
  checkinCount: number;
  isLeader: boolean;
}

interface CheckinData {
  checkins: Array<{
    id: number;
    user_id: number;
    username: string;
    avatar_url: string;
    distance_km: number;
    duration_minutes: number;
    checked_in_at: string;
    total_km: number;
  }>;
  totalDistance: number;
  checkinCount: number;
}

export default function ActivityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [checkinDistance, setCheckinDistance] = useState('');
  const [checkinDuration, setCheckinDuration] = useState('');
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCheckinList, setShowCheckinList] = useState(false);
  const [checkinData, setCheckinData] = useState<CheckinData | null>(null);
  const [checkinListLoading, setCheckinListLoading] = useState(false);

  useEffect(() => {
    loadActivity();
  }, [id]);

  async function loadActivity() {
    try {
      const data = await api.get<ActivityData>(`/activities/${id}`);
      setActivity(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    try {
      await api.post(`/activities/${id}/join`);
      loadActivity();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleCancel() {
    try {
      await api.post(`/activities/${id}/cancel`);
      loadActivity();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleCheckin() {
    try {
      await api.post(`/activities/${id}/checkin`, {
        distance_km: parseFloat(checkinDistance) || 0,
        duration_minutes: parseInt(checkinDuration) || 0,
      });
      setShowCheckinModal(false);
      setCheckinDistance('');
      setCheckinDuration('');
      loadActivity();
      alert('签到成功！');
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function loadCheckinList() {
    try {
      setCheckinListLoading(true);
      const data = await api.get<CheckinData>(`/activities/${id}/checkins`);
      setCheckinData(data);
      setShowCheckinList(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCheckinListLoading(false);
    }
  }

  async function handlePostResult() {
    if (!postContent.trim()) return;
    try {
      await api.post('/posts', {
        content: postContent,
        activity_id: parseInt(id!),
        distance_km: parseFloat(distance) || 0,
        duration_minutes: parseInt(duration) || 0,
      });
      setPostContent('');
      setDistance('');
      setDuration('');
      loadActivity();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleLike(postId: number) {
    try {
      await api.post(`/posts/${postId}/like`);
      loadActivity();
    } catch {
      alert('请先登录');
    }
  }

  async function handleComment(postId: number) {
    const text = commentTexts[postId];
    if (!text?.trim()) return;
    try {
      await api.post(`/posts/${postId}/comments`, { content: text });
      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
      loadActivity();
    } catch (err: any) {
      alert(err.message);
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>;
  if (!activity) return <div style={{ textAlign: 'center', padding: 40 }}>活动不存在</div>;

  return (
    <div>
      {/* Activity header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>{activity.title}</h1>
            <Link to={`/clubs/${activity.club_id}`} style={{ color: '#1a73e8', fontSize: 14 }}>
              {activity.club_name}
            </Link>
            <span style={{ color: '#999', fontSize: 14, marginLeft: 8 }}>发起人: {activity.creator_name}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {user && (
              activity.isJoined ? (
                <button onClick={handleCancel} className="btn-outline">取消报名</button>
              ) : (
                <button onClick={handleJoin} className="btn-primary">报名参加</button>
              )
            )}
            {user && activity.isJoined && !activity.isCheckedIn && (
              <button onClick={() => setShowCheckinModal(true)} className="btn-primary">签到打卡</button>
            )}
            {user && activity.isCheckedIn && (
              <button disabled className="btn-outline" style={{ opacity: 0.7 }}>✓ 已签到</button>
            )}
            {user && activity.isLeader && (
              <button onClick={loadCheckinList} className="btn-outline">
                查看签到名单 ({activity.checkinCount})
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, padding: '16px 0', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>时间</div>
            <div style={{ fontSize: 14 }}>📅 {formatDate(activity.datetime)}</div>
          </div>
          {activity.location && (
            <div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>地点</div>
              <div style={{ fontSize: 14 }}>📍 {activity.location}</div>
            </div>
          )}
          {activity.route && (
            <div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>路线</div>
              <div style={{ fontSize: 14 }}>🗺 {activity.route}</div>
            </div>
          )}
          {activity.pace && (
            <div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>配速</div>
              <div style={{ fontSize: 14 }}>🎯 {activity.pace}</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>参加人数</div>
            <div style={{ fontSize: 14 }}>👥 {activity.participantCount}/{activity.max_participants}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>已签到</div>
            <div style={{ fontSize: 14 }}>✅ {activity.checkinCount} 人</div>
          </div>
        </div>

        {activity.description && (
          <p style={{ marginTop: 12, color: '#666', lineHeight: 1.8 }}>{activity.description}</p>
        )}

        {/* Participants */}
        <div style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 8, fontSize: 14 }}>已报名成员</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {activity.participants.map(p => (
              <Link key={p.user_id} to={`/profile/${p.user_id}`} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                background: '#f0f7ff', borderRadius: 16, fontSize: 13, color: '#333', textDecoration: 'none',
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#e3f2fd',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, color: '#1a73e8',
                }}>
                  {p.username[0]}
                </span>
                {p.username}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Post result */}
      {user && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>晒成绩</h3>
          <textarea
            value={postContent}
            onChange={e => setPostContent(e.target.value)}
            placeholder="分享你在这次活动中的成绩和感受..."
            rows={3}
            style={{ marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>距离 (公里)</label>
              <input type="number" value={distance} onChange={e => setDistance(e.target.value)} placeholder="0" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>时长 (分钟)</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="0" />
            </div>
          </div>
          <button onClick={handlePostResult} disabled={!postContent.trim()} className="btn-primary">发布成绩</button>
        </div>
      )}

      {/* Activity posts */}
      <h3 style={{ marginBottom: 12 }}>活动动态</h3>
      {activity.posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#999' }}>还没有人晒成绩</div>
      ) : (
        activity.posts.map((post: any) => (
          <div key={post.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: '#e3f2fd',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 600, color: '#1a73e8',
              }}>
                {post.username[0]}
              </div>
              <Link to={`/profile/${post.user_id}`} style={{ fontWeight: 600, color: '#333', textDecoration: 'none' }}>
                {post.username}
              </Link>
            </div>
            <p style={{ marginBottom: 10, lineHeight: 1.8 }}>{post.content}</p>
            {post.distance_km > 0 && (
              <div style={{ background: '#f0f7ff', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 13, display: 'flex', gap: 16 }}>
                <span>🏃 {post.distance_km} 公里</span>
                {post.duration_minutes > 0 && <span>⏱ {post.duration_minutes} 分钟</span>}
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#666', marginBottom: 10 }}>
              <button onClick={() => handleLike(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#666' }}>
                🤍 {post.like_count}
              </button>
            </div>

            {/* Comments */}
            {post.comments && post.comments.length > 0 && (
              <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                {post.comments.map((c: any) => (
                  <div key={c.id} style={{ fontSize: 13, marginBottom: 4 }}>
                    <strong>{c.username}</strong>: {c.content}
                  </div>
                ))}
              </div>
            )}

            {user && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={commentTexts[post.id] || ''}
                  onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                  placeholder="写评论..."
                  style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}
                  onKeyDown={e => { if (e.key === 'Enter') handleComment(post.id); }}
                />
                <button onClick={() => handleComment(post.id)} className="btn-primary btn-sm">发送</button>
              </div>
            )}
          </div>
        ))
      )}

      {/* Checkin Modal */}
      {showCheckinModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>签到打卡</h3>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
              填写本次跑步的距离和时长，签到后将自动累计到您的总跑量
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>距离 (公里)</label>
                <input
                  type="number"
                  value={checkinDistance}
                  onChange={e => setCheckinDistance(e.target.value)}
                  placeholder="0"
                  step="0.1"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>时长 (分钟)</label>
                <input
                  type="number"
                  value={checkinDuration}
                  onChange={e => setCheckinDuration(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCheckinModal(false)} className="btn-outline">取消</button>
              <button onClick={handleCheckin} className="btn-primary">确认签到</button>
            </div>
          </div>
        </div>
      )}

      {/* Checkin List Modal */}
      {showCheckinList && checkinData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: 20,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 600, maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
              <h3 style={{ margin: 0 }}>签到名单</h3>
              <button onClick={() => setShowCheckinList(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '16px 20px', background: '#f9f9f9', display: 'flex', gap: 24, fontSize: 14 }}>
              <span>签到人数: <strong>{checkinData.checkinCount}</strong></span>
              <span>总跑量: <strong>{checkinData.totalDistance.toFixed(1)}</strong> 公里</span>
            </div>
            <div style={{ padding: '12px 20px' }}>
              {checkinData.checkins.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无签到记录</div>
              ) : (
                checkinData.checkins.map((c, idx) => (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 0', borderBottom: idx < checkinData.checkins.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: '#e3f2fd',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 600, color: '#1a73e8',
                    }}>
                      {c.username[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Link to={`/profile/${c.user_id}`} style={{ fontWeight: 600, color: '#333', textDecoration: 'none' }}>
                        {c.username}
                      </Link>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                        签到时间: {new Date(c.checked_in_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 13 }}>
                      <div style={{ color: '#1a73e8', fontWeight: 600 }}>{c.distance_km.toFixed(1)} 公里</div>
                      {c.duration_minutes > 0 && (
                        <div style={{ color: '#666' }}>{c.duration_minutes} 分钟</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
