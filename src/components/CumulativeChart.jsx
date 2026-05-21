import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

function formatDate(str) {
  const [y, m, d] = str.split('-');
  return `${d}/${m}`;
}

export default function CumulativeChart({ enriched, hidden }) {
  if (!enriched || enriched.length === 0) return null;

  const data = enriched.map(e => ({
    date: formatDate(e.date),
    cumulative: e.cumulative,
  }));

  return (
    <div className="card">
      <h2 className="card-title">סכום מצטבר לאורך זמן</h2>
      {hidden ? (
        <div className="hidden-chart-msg">הגרף מוסתר במצב פרטיות</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₪${v.toLocaleString()}`} />
            <Tooltip formatter={v => [`₪${Number(v).toLocaleString()}`, 'מצטבר']} labelFormatter={l => `תאריך: ${l}`} />
            <ReferenceLine y={0} stroke="#9ca3af" />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#4f86c6"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
