import { useState } from 'react';

const today = () => new Date().toISOString().slice(0, 10);

export default function EntryForm({ entries, onSave, onEditRequest }) {
  const [date, setDate] = useState(today());
  const [type, setType] = useState('profit');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setMsg({ kind: 'error', text: 'יש להזין סכום חוקי.' });
      return;
    }

    const existing = entries.find(en => en.date === date);
    if (existing) {
      setMsg({
        kind: 'warn',
        text: `כבר קיימת רשומה לתאריך ${date}. ניתן לערוך אותה בטבלת ההיסטוריה.`,
      });
      onEditRequest(existing.id);
      return;
    }

    const entry = {
      id: crypto.randomUUID(),
      date,
      type,
      amount: Number(amount),
    };
    onSave(entry);
    setAmount('');
    setDate(today());
    setType('profit');
    setMsg({ kind: 'success', text: 'הרשומה נשמרה בהצלחה!' });
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div className="card">
      <h2 className="card-title">הזנת תוצאה יומית</h2>
      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-row">
          <label>תאריך</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={today()}
            required
          />
        </div>
        <div className="form-row">
          <label>סוג</label>
          <div className="type-toggle">
            <button
              type="button"
              className={`toggle-btn profit ${type === 'profit' ? 'active' : ''}`}
              onClick={() => setType('profit')}
            >
              רווח
            </button>
            <button
              type="button"
              className={`toggle-btn loss ${type === 'loss' ? 'active' : ''}`}
              onClick={() => setType('loss')}
            >
              הפסד
            </button>
          </div>
        </div>
        <div className="form-row">
          <label>סכום (₪)</label>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary">שמור</button>
      </form>
      {msg && (
        <div className={`form-msg ${msg.kind}`}>{msg.text}</div>
      )}
    </div>
  );
}
