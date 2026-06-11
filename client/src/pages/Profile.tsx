import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import MedalWall from '../components/MedalWall';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar_url: string;
  bio: string;
  total_km: number;
  best_marathon_time: string;
  created_at: string;
}

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

interface Medal {
  id: number;
  event_name: string;
  year: number;
  medal_type: string;
}

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [medals, setMedals] = useState<Medal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');

  const isOwn = currentUser && currentUser.id === parseInt(id || '0');

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [userPosts, userProfile, userMedals] = await Promise.all([
        api.get<Post[]>(`/posts/user/${id}`),
        api.get<UserProfile>(`/auth/users/${id}`),
        api.get<Medal[]>(`/auth/users/${id}/medals`),
      ]);
      setPosts(userPosts);
      setProfile(userProfile);
      setMedals(userMedals);
      setBio(userProfile.bio || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  async function saveProfile() {
    try {
      const updated = await api.put<UserProfile>('/auth/profile', { bio });
      setProfile(updated);
      setEditing(false);
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>;
  }

  // Estimate profile from posts if not own profile
  const displayName = profile?.username || (posts.length > 0 ? posts[0].username : '用户');
  const totalKm = profile?.total_km ?? posts.reduce((sum, p) => sum + p.distance_km, 0);

  return (
    <div>
      {/* Profile header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: '#e3f2fd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 700, color: '#1a73e8', flexShrink: 0,
          }}>
            {displayName[0]}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: 8 }}>{displayName}</h2>
            {editing ? (
              <div>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} style={{ width: '100%', marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveProfile} className="btn-primary btn-sm">保存</button>
                  <button onClick={() => setEditing(false)} className="btn-outline btn-sm">取消</button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ color: '#666', marginBottom: 8 }}>{profile?.bio || ''}</p>
                {isOwn && (
                  <button onClick={() => setEditing(true)} className="btn-outline btn-sm">编辑资料</button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 24, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1a73e8' }}>{totalKm.toFixed(1)}</div>
            <div style={{ fontSize: 12, color: '#666' }}>累计公里</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1a73e8' }}>{posts.length}</div>
            <div style={{ fontSize: 12, color: '#666' }}>动态</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1a73e8' }}>{profile?.best_marathon_time || '--'}</div>
            <div style={{ fontSize: 12, color: '#666' }}>最好成绩</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1a73e8' }}>{medals.length}</div>
            <div style={{ fontSize: 12, color: '#666' }}>奖牌</div>
          </div>
        </div>
      </div>

      {/* Medal wall */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16 }}>🏅 赛事奖牌墙</h3>
        <MedalWall medals={medals} />
      </div>

      {/* User posts */}
      <h3 style={{ marginBottom: 12 }}>跑步动态</h3>
      {posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#999' }}>还没有发布动态</div>
      ) : (
        posts.map(post => (
          <PostCard key={post.id} post={post} onLike={handleLike} />
        ))
      )}
    </div>
  );
}
