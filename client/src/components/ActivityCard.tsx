import { Link } from 'react-router-dom';

interface Activity {
  id: number;
  title: string;
  location: string;
  datetime: string;
  pace: string;
  participant_count: number;
  max_participants: number;
  status: string;
  club_name?: string;
}

interface Props {
  activity: Activity;
}

export default function ActivityCard({ activity }: Props) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const statusColors: Record<string, string> = {
    upcoming: '#34a853',
    ongoing: '#fbbc04',
    finished: '#999',
  };

  const statusLabels: Record<string, string> = {
    upcoming: '即将开始',
    ongoing: '进行中',
    finished: '已结束',
  };

  return (
    <Link to={`/activities/${activity.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ fontSize: 16 }}>{activity.title}</h4>
          <span style={{
            fontSize: 12, color: statusColors[activity.status], background: statusColors[activity.status] + '20',
            padding: '2px 8px', borderRadius: 10,
          }}>
            {statusLabels[activity.status]}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#666', flexWrap: 'wrap' }}>
          <span>📅 {formatDate(activity.datetime)}</span>
          {activity.location && <span>📍 {activity.location}</span>}
          {activity.pace && <span>🎯 {activity.pace}</span>}
          <span>👥 {activity.participant_count}/{activity.max_participants}</span>
        </div>
      </div>
    </Link>
  );
}
