interface RankedUser {
  id: number;
  username: string;
  avatar_url: string;
  weekly_km: number;
}

interface Props {
  ranking: RankedUser[];
}

export default function WeeklyRanking({ ranking }: Props) {
  if (ranking.length === 0) {
    return <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无数据</p>;
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div>
      {ranking.map((user, index) => (
        <div key={user.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 0',
          borderBottom: index < ranking.length - 1 ? '1px solid #f0f0f0' : 'none',
        }}>
          <span style={{ width: 28, textAlign: 'center', fontSize: index < 3 ? 20 : 14, fontWeight: index < 3 ? 400 : 600, color: index < 3 ? 'inherit' : '#999' }}>
            {index < 3 ? medals[index] : index + 1}
          </span>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#e3f2fd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 600, color: '#1a73e8', flexShrink: 0,
          }}>
            {user.username[0]}
          </div>
          <span style={{ flex: 1, fontSize: 14 }}>{user.username}</span>
          <span style={{ fontWeight: 600, color: '#1a73e8', fontSize: 14 }}>{user.weekly_km.toFixed(1)} km</span>
        </div>
      ))}
    </div>
  );
}
