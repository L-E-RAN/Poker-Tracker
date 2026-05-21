import { currentMonthKey } from '../utils/calculations';

function fmt(val, hidden) {
  if (hidden) return '₪••••';
  const abs = Math.abs(val);
  const sign = val >= 0 ? '+' : '-';
  return `${sign}₪${abs.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function Card({ label, value, sub, color }) {
  return (
    <div className={`stat-card ${color || ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function DashboardCards({ stats, settings, hidden }) {
  if (!stats) {
    return (
      <div className="card">
        <p className="empty-msg">עדיין אין נתונים. הוסף את הרשומה הראשונה שלך.</p>
      </div>
    );
  }

  const {
    total, monthTotal, weekTotal, profitDays, lossDays,
    avg, best, worst, currentProfitStreak, currentLossStreak, maxProfitStreak,
  } = stats;

  const monthKey = currentMonthKey();
  const { monthlyGoal, stopLoss } = settings;
  const goalNum = parseFloat(monthlyGoal);
  const stopNum = parseFloat(stopLoss);

  const goalPct = goalNum > 0 ? Math.min(100, Math.round((monthTotal / goalNum) * 100)) : null;
  const stopBreached = stopNum > 0 && monthTotal <= -stopNum;

  return (
    <div className="dashboard-section">
      <div className="cards-grid">
        <Card label="סה״כ מצטבר" value={fmt(total, hidden)} color={total >= 0 ? 'green' : 'red'} />
        <Card label="החודש" value={fmt(monthTotal, hidden)} color={monthTotal >= 0 ? 'green' : 'red'} />
        <Card label="השבוע" value={fmt(weekTotal, hidden)} color={weekTotal >= 0 ? 'green' : 'red'} />
        <Card label="ימי רווח" value={profitDays} color="green" />
        <Card label="ימי הפסד" value={lossDays} color="red" />
        <Card label="ממוצע יומי" value={fmt(avg, hidden)} color={avg >= 0 ? 'green' : 'red'} />
        <Card
          label="היום הכי רווחי"
          value={hidden ? '₪••••' : `₪${best.amount.toLocaleString()}`}
          sub={best.date}
          color="green"
        />
        <Card
          label="היום הכי גרוע"
          value={hidden ? '₪••••' : `-₪${worst.amount.toLocaleString()}`}
          sub={worst.date}
          color="red"
        />
        <Card label="רצף רווחים נוכחי" value={`${currentProfitStreak} ימים`} />
        <Card label="רצף הפסדים נוכחי" value={`${currentLossStreak} ימים`} />
        <Card label="שיא רצף רווחים" value={`${maxProfitStreak} ימים`} color="green" />
      </div>

      {goalPct !== null && (
        <div className="goal-bar-wrap">
          <div className="goal-bar-label">
            התקדמות ליעד חודשי
            {!hidden && ` (${fmt(monthTotal, false)} מתוך ₪${goalNum.toLocaleString()})`}
          </div>
          <div className="goal-bar-track">
            <div
              className={`goal-bar-fill ${monthTotal >= 0 ? 'green' : 'red'}`}
              style={{ width: `${Math.max(0, goalPct)}%` }}
            />
          </div>
          <div className="goal-bar-pct">{goalPct}%</div>
        </div>
      )}

      {stopBreached && (
        <div className="alert alert-red">
          ⚠️ חרגת מגבול ההפסד החודשי שלך ({!hidden && `₪${stopNum.toLocaleString()}`}). כדאי לעצור ולחשוב מחדש.
        </div>
      )}

      {currentLossStreak >= 3 && (
        <div className="alert alert-neutral">
          יש כרגע רצף של {currentLossStreak} ימי הפסד. אולי שווה לקחת רגע לבדוק את התמונה הגדולה.
        </div>
      )}

      {monthTotal < 0 && (
        <div className="alert alert-yellow">
          החודש סגור במינוס כרגע. שווה לבדוק מה קרה.
        </div>
      )}
    </div>
  );
}
