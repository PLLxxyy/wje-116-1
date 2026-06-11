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
          {user && (
            activity.isJoined ? (
              <button onClick={handleCancel} className="btn-outline">取消报名</button>
            ) : (
              <button onClick={handleJoin} className="btn-primary">报名参加</button>
            )
          )}
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
    </div>
  );
}
