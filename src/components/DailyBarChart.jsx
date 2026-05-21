import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

function formatDate(str) {
  const [y, m, d] = str.split('-');
  return `${d}/${m}`;
}

export default function DailyBarChart({ enriched, hidden }) {
  if (!enriched || enriched.length === 0) return null;

  const data = enriched.map(e => ({
    date: formatDate(e.date),
    value: e.signedAmount,
  }));

  return (
    <div className="card">
      <h2 className="card-title">תוצאות יומיות</h2>
      {hidden ? (
        <div className="hidden-chart-msg">הגרף מוסתר במצב פרטיות</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₪${v.toLocaleString()}`} />
            <Tooltip formatter={v => [`₪${Number(v).toLocaleString()}`, 'תוצאה']} labelFormatter={l => `תאריך: ${l}`} />
            <ReferenceLine y={0} stroke="#9ca3af" />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.value >= 0 ? '#4ade80' : '#f87171'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
