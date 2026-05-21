import { useState } from 'react';
import confetti from 'canvas-confetti';
import EntryForm from './components/EntryForm';
import DashboardCards from './components/DashboardCards';
import CumulativeChart from './components/CumulativeChart';
import DailyBarChart from './components/DailyBarChart';
import MonthlyCalendar from './components/MonthlyCalendar';
import HistoryTable from './components/HistoryTable';
import SettingsPanel from './components/SettingsPanel';
import { loadEntries, saveEntries, loadSettings, saveSettings } from './utils/storage';
import { computeStats } from './utils/calculations';
import { exportCSV } from './utils/csv';
import './App.css';

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

export default function App() {
  const [entries, setEntries] = useState(() => loadEntries());
  const [settings, setSettings] = useState(() => loadSettings());
  const [hidden, setHidden] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [editHighlight, setEditHighlight] = useState(null);

  const stats = computeStats(entries);

  function handleSave(entry) {
    const newEntries = [...entries, entry];
    setEntries(newEntries);
    saveEntries(newEntries);

    const prevStats = computeStats(entries);
    const newStats = computeStats(newEntries);
    if (newStats) {
      const prevMax = prevStats ? prevStats.maxProfitStreak : 0;
      const streak = newStats.currentProfitStreak;
      if (streak === 3 || (streak > prevMax && streak > 3)) {
        fireConfetti();
      }
    }
  }

  function handleDelete(id) {
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    saveEntries(newEntries);
  }

  function handleUpdate(id, data) {
    const newEntries = entries.map(e => (e.id === id ? { ...e, ...data } : e));
    setEntries(newEntries);
    saveEntries(newEntries);
  }

  function handleSettingsSave(s) {
    setSettings(s);
    saveSettings(s);
  }

  function handleEditRequest(id) {
    setTab('history');
    setEditHighlight(id);
    setTimeout(() => setEditHighlight(null), 100);
  }

  return (
    <div className="app" dir="rtl">
      <header className="app-header">
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
