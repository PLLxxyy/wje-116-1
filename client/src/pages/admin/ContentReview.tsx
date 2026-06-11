import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

interface Report {
  id: number;
  reporter_name: string;
  target_type: string;
  target_id: number;
  reason: string;
  status: string;
  created_at: string;
}

export default function ContentReview() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const data = await api.get<Report[]>('/admin/reports');
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(id: number) {
    try {
      await api.put(`/admin/reports/${id}/resolve`);
      loadReports();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDeletePost(targetId: number, reportId: number) {
    if (!confirm('确定要删除该内容吗？')) return;
    try {
      await api.delete(`/admin/posts/${targetId}`);
      await api.put(`/admin/reports/${reportId}/resolve`);
      loadReports();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <Link to="/admin" style={{ fontSize: 14 }}>← 返回后台</Link>
        <h1 style={{ fontSize: 24 }}>内容审核</h1>
      </div>

      {reports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#999' }}>暂无举报</div>
      ) : (
        reports.map(report => (
          <div key={report.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{
                    fontSize: 12, padding: '2px 8px', borderRadius: 4,
                    background: report.status === 'pending' ? '#fff3e0' : '#e8f5e9',
                    color: report.status === 'pending' ? '#e65100' : '#2e7d32',
                  }}>
                    {report.status === 'pending' ? '待处理' : '已处理'}
                  </span>
                  <span style={{ fontSize: 12, color: '#666' }}>
                    {report.target_type === 'post' ? '动态' : '评论'} #{report.target_id}
                  </span>
                </div>
                <p style={{ marginBottom: 6, fontSize: 14 }}>举报原因: {report.reason}</p>
                <div style={{ fontSize: 12, color: '#999' }}>
                  举报人: {report.reporter_name} · {new Date(report.created_at + 'Z').toLocaleDateString('zh-CN')}
                </div>
              </div>
              {report.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handleDeletePost(report.target_id, report.id)} className="btn-danger btn-sm">删除内容</button>
                  <button onClick={() => handleResolve(report.id)} className="btn-outline btn-sm">忽略</button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
