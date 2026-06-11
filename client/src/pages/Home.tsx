import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';

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
}

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const data = await api.get<Post[]>('/posts');
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePost() {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      await api.post('/posts', {
        content: newPost,
        distance_km: parseFloat(distance) || 0,
        duration_minutes: parseInt(duration) || 0,
      });
      setNewPost('');
      setDistance('');
      setDuration('');
      loadPosts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPosting(false);
    }
  }

  async function handleLike(postId: number) {
    try {
      const res = await api.post<{ liked: boolean }>(`/posts/${postId}/like`);
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, liked: res.liked, like_count: res.liked ? p.like_count + 1 : p.like_count - 1 }
          : p
      ));
    } catch {
      alert('请先登录');
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>跑步社区</h1>
        <p style={{ color: '#666' }}>分享你的跑步故事</p>
      </div>

      {user && (
        <div className="card" style={{ marginBottom: 20 }}>
          <textarea
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder="写点什么，分享今天的跑步感受..."
            rows={3}
            style={{ resize: 'vertical', marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>距离 (公里)</label>
              <input type="number" value={distance} onChange={e => setDistance(e.target.value)} placeholder="0" min="0" step="0.1" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>时长 (分钟)</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="0" min="0" />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button onClick={handlePost} disabled={posting || !newPost.trim()} className="btn-primary">
              {posting ? '发布中...' : '发布动态'}
            </button>
          </div>
        </div>
      )}

      {!user && (
        <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ marginBottom: 12 }}>登录后可以发布动态、加入跑团</p>
          <Link to="/login">
            <button className="btn-primary">立即登录</button>
          </Link>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>加载中...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>还没有动态</div>
      ) : (
        posts.map(post => (
          <PostCard key={post.id} post={post} onLike={handleLike} />
        ))
      )}
    </div>
  );
}
