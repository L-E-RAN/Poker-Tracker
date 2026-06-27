import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import EntryForm from './components/EntryForm';
import DashboardCards from './components/DashboardCards';
import CumulativeChart from './components/CumulativeChart';
import DailyBarChart from './components/DailyBarChart';
import MonthlyCalendar from './components/MonthlyCalendar';
import HistoryTable from './components/HistoryTable';
import SettingsPanel from './components/SettingsPanel';
import { useAuth } from './auth/AuthProvider';
import {
  getEntries, addEntry, updateEntry, deleteEntry,
  getSettings, saveSettings as apiSaveSettings,
} from './lib/api';
import { computeStats } from './utils/calculations';
import { exportCSV } from './utils/csv';

const TABS = [
  { id: 'dashboard', label: 'דשבורד' },
  { id: 'charts', label: 'גרפים' },
  { id: 'calendar', label: 'לוח שנה' },
  { id: 'history', label: 'היסטוריה' },
  { id: 'settings', label: 'הגדרות' },
];

function fireConfetti() {
  confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#4ade80', '#22c55e', '#16a34a', '#fbbf24', '#f59e0b'],
  });
}

export default function AppMain({ access }) {
  const { user, signOut } = useAuth();
  const [entries, setEntries] = useState([]);
  const [settings, setSettings] = useState({ monthlyGoal: '', stopLoss: '' });
  const [hidden, setHidden] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [editHighlight, setEditHighlight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [e, s] = await Promise.all([getEntries(), getSettings()]);
        if (!alive) return;
        setEntries(e);
        setSettings(s);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const stats = computeStats(entries);

  async function handleSave(entry) {
    const prevStats = computeStats(entries);
    const saved = await addEntry(user, entry);
    const newEntries = [...entries, saved];
    setEntries(newEntries);

    const newStats = computeStats(newEntries);
    if (newStats) {
      const prevMax = prevStats ? prevStats.maxProfitStreak : 0;
      const streak = newStats.currentProfitStreak;
      if (streak === 3 || (streak > prevMax && streak > 3)) fireConfetti();
    }
  }

  async function handleDelete(id) {
    await deleteEntry(id);
    setEntries(entries.filter(e => e.id !== id));
  }

  async function handleUpdate(id, data) {
    await updateEntry(id, data);
    setEntries(entries.map(e => (e.id === id ? { ...e, ...data } : e)));
  }

  async function handleSettingsSave(s) {
    await apiSaveSettings(user, s);
    setSettings(s);
  }

  function handleEditRequest(id) {
    setTab('history');
    setEditHighlight(id);
    setTimeout(() => setEditHighlight(null), 100);
  }

  if (loading) {
    return (
      <div className="auth-screen" dir="rtl">
        <div className="auth-card"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="app" dir="rtl">
      <header className="app-header">
        {access.reason === 'trial' && (
          <div className="trial-banner">
            תקופת ניסיון: נותרו {access.daysLeft} ימים. לאחר מכן יידרש מנוי חודשי.
          </div>
        )}
        <div className="header-inner">
          <div className="header-title">
            <span className="header-icon">♠</span>
            <h1>מעקב פוקר</h1>
          </div>
          <div className="header-actions">
            <button
              className={`btn-icon ${hidden ? 'active' : ''}`}
              onClick={() => setHidden(h => !h)}
              title={hidden ? 'הצג סכומים' : 'הסתר סכומים'}
            >
              {hidden ? '👁' : '🙈'}
            </button>
            <button
              className="btn-icon"
              onClick={() => exportCSV(entries)}
              title="ייצוא CSV"
              disabled={!entries.length}
            >
              ⬇ CSV
            </button>
            <button className="btn-icon" onClick={signOut} title="התנתקות">
              ⎋
            </button>
          </div>
        </div>
        <nav className="tab-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === 'dashboard' && (
          <>
            <EntryForm entries={entries} onSave={handleSave} onEditRequest={handleEditRequest} />
            <DashboardCards stats={stats} settings={settings} hidden={hidden} />
          </>
        )}
        {tab === 'charts' && (
          <>
            <CumulativeChart enriched={stats?.enriched} hidden={hidden} />
            <DailyBarChart enriched={stats?.enriched} hidden={hidden} />
          </>
        )}
        {tab === 'calendar' && (
          <MonthlyCalendar enriched={stats?.enriched} hidden={hidden} />
        )}
        {tab === 'history' && (
          <HistoryTable
            entries={entries}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            highlightId={editHighlight}
            hidden={hidden}
          />
        )}
        {tab === 'settings' && (
          <SettingsPanel settings={settings} onSave={handleSettingsSave} />
        )}
      </main>
    </div>
  );
}
