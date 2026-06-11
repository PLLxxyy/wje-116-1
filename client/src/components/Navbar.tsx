import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      background: '#1a73e8',
      color: '#fff',
      padding: '0 16px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link to="/" style={{ color: '#fff', fontWeight: 700, fontSize: 18, textDecoration: 'none' }}>
          🏃 跑团社交
        </Link>
        <Link to="/clubs" style={{ color: '#fff', textDecoration: 'none', fontSize: 14 }}>跑团列表</Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user ? (
          <>
            <Link to={`/profile/${user.id}`} style={{ color: '#fff', textDecoration: 'none', fontSize: 14 }}>
              {user.username}
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" style={{ color: '#fff', textDecoration: 'none', fontSize: 14, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 4 }}>
                管理后台
              </Link>
            )}
            <button onClick={handleLogout} style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
            }}>
              退出
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none', fontSize: 14 }}>登录</Link>
            <Link to="/signup" style={{
              color: '#1a73e8',
              background: '#fff',
              padding: '6px 14px',
              borderRadius: 4,
              textDecoration: 'none',
              fontSize: 14,
            }}>注册</Link>
          </>
        )}
      </div>
    </nav>
  );
}
