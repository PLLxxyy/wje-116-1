import { Link } from 'react-router-dom';

interface Post {
  id: number;
  user_id: number;
  username: string;
  avatar_url: string;
  content: string;
  distance_km: number;
  duration_minutes: number;
  image_url: string;
  like_count: number;
  comment_count: number;
  liked?: boolean;
  created_at: string;
  activity_id?: number;
}

interface Props {
  post: Post;
  onLike?: (id: number) => void;
}

export default function PostCard({ post, onLike }: Props) {
  const formatTime = (minutes: number) => {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'Z');
    return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: '#e3f2fd',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 600, color: '#1a73e8',
        }}>
          {post.username[0]}
        </div>
        <div>
          <Link to={`/profile/${post.user_id}`} style={{ fontWeight: 600, color: '#333', textDecoration: 'none' }}>
            {post.username}
          </Link>
          <div style={{ fontSize: 12, color: '#999' }}>{formatDate(post.created_at)}</div>
        </div>
      </div>

      <p style={{ marginBottom: 12, lineHeight: 1.8 }}>{post.content}</p>

      {(post.distance_km > 0 || post.duration_minutes > 0) && (
        <div style={{
          background: '#f0f7ff', borderRadius: 8, padding: '10px 14px',
          display: 'flex', gap: 20, marginBottom: 12, fontSize: 13,
        }}>
          {post.distance_km > 0 && (
            <span>🏃 {post.distance_km} 公里</span>
          )}
          {post.duration_minutes > 0 && (
            <span>⏱ {formatTime(post.duration_minutes)}</span>
          )}
          {post.distance_km > 0 && post.duration_minutes > 0 && (
            <span>📊 配速 {(post.duration_minutes / post.distance_km).toFixed(1)} 分/公里</span>
          )}
        </div>
      )}

      {post.image_url && (
        <div style={{ marginBottom: 12 }}>
          <img src={post.image_url} alt="" style={{ maxWidth: '100%', borderRadius: 8 }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, color: '#666', fontSize: 13 }}>
        <button
          onClick={() => onLike?.(post.id)}
          style={{
            background: 'none', border: 'none', padding: 0,
            color: post.liked ? '#ea4335' : '#666', cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {post.liked ? '❤️' : '🤍'} {post.like_count}
        </button>
        <Link to={`/activities/${post.activity_id || 0}`} style={{ color: '#666', textDecoration: 'none', display: 'none' }}>
          💬 {post.comment_count}
        </Link>
        <span>💬 {post.comment_count} 评论</span>
      </div>
    </div>
  );
}
