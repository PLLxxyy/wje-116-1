import { Link } from 'react-router-dom';

interface Club {
  id: number;
  name: string;
  description: string;
  city: string;
  member_count: number;
  owner_name: string;
}

interface Props {
  club: Club;
}

export default function ClubCard({ club }: Props) {
  return (
    <Link to={`/clubs/${club.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>{club.name}</h3>
            <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#666', marginBottom: 8 }}>
              {club.city && <span>📍 {club.city}</span>}
              <span>👥 {club.member_count} 人</span>
              <span>团长: {club.owner_name}</span>
            </div>
          </div>
        </div>
        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>{club.description}</p>
      </div>
    </Link>
  );
}
