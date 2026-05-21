import { useState } from 'react';
import { withCumulative, sortedEntries } from '../utils/calculations';

function formatDate(str) {
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

export default function HistoryTable({ entries, onDelete, onUpdate, highlightId, hidden }) {
  const [editId, setEditId] = useState(highlightId || null);
  const [editData, setEditData] = useState({});

  const sorted = withCumulative(sortedEntries(entries)).reverse();

  function startEdit(e) {
    setEditId(e.id);
    setEditData({ date: e.date, type: e.type, amount: e.amount });
  }

  function cancelEdit() {
    setEditId(null);
    setEditData({});
  }

  function saveEdit(id) {
    if (!editData.amount || isNaN(Number(editData.amount)) || Number(editData.amount) <= 0) return;
    onUpdate(id, { ...editData, amount: Number(editData.amount) });
    setEditId(null);
    setEditData({});
  }

  if (!sorted.length) return null;

  return (
    <div className="card">
      <h2 className="card-title">היסטוריה</h2>
      <div className="table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>תאריך</th>
              <th>סוג</th>
              <th>סכום</th>
              <th>מצטבר</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(e => {
              const isEdit = editId === e.id;
              return (
                <tr key={e.id} className={e.signedAmount >= 0 ? 'row-profit' : 'row-loss'}>
                  {isEdit ? (
                    <>
                      <td>
                        <input
                          type="date"
                          value={editData.date}
                          onChange={ev => setEditData(d => ({ ...d, date: ev.target.value }))}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <select
                          value={editData.type}
                          onChange={ev => setEditData(d => ({ ...d, type: ev.target.value }))}
                          className="edit-input"
                        >
                          <option value="profit">רווח</option>
                          <option value="loss">הפסד</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={editData.amount}
                          onChange={ev => setEditData(d => ({ ...d, amount: ev.target.value }))}
                          className="edit-input"
                        />
                      </td>
                      <td>—</td>
                      <td>
                        <button className="btn-sm green" onClick={() => saveEdit(e.id)}>שמור</button>
                        <button className="btn-sm" onClick={cancelEdit}>ביטול</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{formatDate(e.date)}</td>
                      <td>
                        <span className={`badge ${e.type}`}>
                          {e.type === 'profit' ? 'רווח' : 'הפסד'}
                        </span>
                      </td>
                      <td className={e.signedAmount >= 0 ? 'amt-profit' : 'amt-loss'}>
                        {hidden ? '₪••••' : (
                          <span dir="ltr">
                            {`${e.signedAmount >= 0 ? '+' : '-'}₪${Math.abs(e.amount).toLocaleString()}`}
                          </span>
                        )}
                      </td>
                      <td className={e.cumulative >= 0 ? 'amt-profit' : 'amt-loss'}>
                        {hidden ? '₪••••' : (
                          <span dir="ltr">
                            {`${e.cumulative >= 0 ? '' : '-'}₪${Math.abs(e.cumulative).toLocaleString()}`}
                          </span>
                        )}
                      </td>
                      <td>
                        <button className="btn-sm" onClick={() => startEdit(e)}>עריכה</button>
                        <button className="btn-sm red" onClick={() => onDelete(e.id)}>מחיקה</button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
