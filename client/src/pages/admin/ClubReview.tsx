import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

interface PendingClub {
  id: number;
  name: string;
  description: string;
  city: string;
  owner_name: string;
  created_at: string;
}

export default function ClubReview() {
  const [clubs, setClubs] = useState<PendingClub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClubs();
  }, []);

  async function loadClubs() {
    try {
      const data = await api.get<PendingClub[]>('/admin/clubs/pending');
      setClubs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: number) {
    try {
      await api.put(`/admin/clubs/${id}/approve`);
      loadClubs();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleReject(id: number) {
    if (!confirm('确定要拒绝该跑团吗？')) return;
    try {
      await api.put(`/admin/clubs/${id}/reject`);
      loadClubs();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <Link to="/admin" style={{ fontSize: 14 }}>← 返回后台</Link>
        <h1 style={{ fontSize: 24 }}>跑团审核</h1>
      </div>

      {clubs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#999' }}>暂无待审核跑团</div>
      ) : (
        clubs.map(club => (
          <div key={club.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ marginBottom: 8 }}>{club.name}</h3>
                <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#666', marginBottom: 8 }}>
                  <span>创建人: {club.owner_name}</span>
                  {club.city && <span>城市: {club.city}</span>}
                  <span>申请时间: {new Date(club.created_at + 'Z').toLocaleDateString('zh-CN')}</span>
                </div>
                <p style={{ color: '#666', fontSize: 14 }}>{club.description}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => handleApprove(club.id)} className="btn-success btn-sm">通过</button>
                <button onClick={() => handleReject(club.id)} className="btn-danger btn-sm">拒绝</button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
