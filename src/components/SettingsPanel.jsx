import { useState } from 'react';

export default function SettingsPanel({ settings, onSave }) {
  const [monthlyGoal, setMonthlyGoal] = useState(settings.monthlyGoal || '');
  const [stopLoss, setStopLoss] = useState(settings.stopLoss || '');
  const [saved, setSaved] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ monthlyGoal, stopLoss });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="card">
      <h2 className="card-title">יעדים והגדרות</h2>
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-row">
          <label>יעד רווח חודשי (₪)</label>
          <input
            type="number"
            min="0"
            placeholder="ללא יעד"
            value={monthlyGoal}
            onChange={e => setMonthlyGoal(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>גבול הפסד חודשי / Stop Loss (₪)</label>
          <input
            type="number"
            min="0"
            placeholder="ללא הגבלה"
            value={stopLoss}
            onChange={e => setStopLoss(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary">שמור הגדרות</button>
        {saved && <div className="form-msg success">ההגדרות נשמרו!</div>}
      </form>
    </div>
  );
}
