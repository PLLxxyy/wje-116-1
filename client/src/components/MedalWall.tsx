interface Medal {
  id: number;
  event_name: string;
  year: number;
  medal_type: string;
}

interface Props {
  medals: Medal[];
}

export default function MedalWall({ medals }: Props) {
  if (medals.length === 0) {
    return <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>还没有赛事奖牌</p>;
  }

  const medalColors: Record<string, string> = {
    '全马完赛': '#FFD700',
    '半马完赛': '#C0C0C0',
    '50公里越野': '#CD7F32',
    '100公里越野': '#FFD700',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
      {medals.map(medal => (
        <div key={medal.id} style={{
          background: '#fff',
          borderRadius: 12,
          padding: 16,
          textAlign: 'center',
          border: '2px solid',
          borderColor: medalColors[medal.medal_type] || '#ddd',
          transition: 'transform 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏅</div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{medal.event_name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{medal.year} · {medal.medal_type}</div>
        </div>
      ))}
    </div>
  );
}
