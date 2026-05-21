import { useState } from 'react';

const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function monthKey(y, m) {
  return `${y}-${pad(m + 1)}`;
}

export default function MonthlyCalendar({ enriched, hidden }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const mk = monthKey(year, month);
  const map = {};
  (enriched || [])
    .filter(e => e.date.startsWith(mk))
    .forEach(e => { map[e.date] = e; });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
  ];

  return (
    <div className="card">
      <div className="cal-header">
        <button className="cal-nav" onClick={prev}>›</button>
        <h2 className="card-title" style={{ margin: 0 }}>{monthNames[month]} {year}</h2>
        <button className="cal-nav" onClick={next}>‹</button>
      </div>
      <div className="cal-grid">
        {DAYS.map(d => (
          <div key={d} className="cal-day-name">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
          const entry = map[dateStr];
          let cls = 'cal-day';
          if (entry) cls += entry.signedAmount >= 0 ? ' cal-profit' : ' cal-loss';
          return (
            <div key={dateStr} className={cls}>
              <span className="cal-day-num">{d}</span>
              {entry && !hidden && (
                <span className="cal-day-amt">
                  {entry.signedAmount >= 0 ? '+' : ''}
                  {entry.signedAmount.toLocaleString()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
