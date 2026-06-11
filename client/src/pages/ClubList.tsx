import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import ClubCard from '../components/ClubCard';

interface Club {
  id: number;
  name: string;
  description: string;
  city: string;
  member_count: number;
  owner_name: string;
}

export default function ClubList() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadClubs();
  }, []);

  async function loadClubs() {
    try {
      const data = await api.get<Club[]>('/clubs');
      setClubs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/clubs', { name, description, city });
      alert('跑团创建成功，等待管理员审核');
      setShowCreate(false);
      setName('');
      setDescription('');
      setCity('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24 }}>跑团列表</h1>
        {user && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
            {showCreate ? '取消' : '创建跑团'}
          </button>
        )}
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16 }}>创建新跑团</h3>
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>跑团名称 *</label>
              <input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>所在城市</label>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="北京" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>跑团简介</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? '创建中...' : '提交审核'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>加载中...</div>
      ) : clubs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#999' }}>还没有跑团</div>
      ) : (
        clubs.map(club => <ClubCard key={club.id} club={club} />)
      )}
    </div>
  );
}
