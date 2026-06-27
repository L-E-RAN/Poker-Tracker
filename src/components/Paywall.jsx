import { useState } from 'react';
import { supabase, PRICE_ILS } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

export default function Paywall({ reason }) {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      // Edge function builds a Grow (משולם) recurring payment link for this user.
      const { data, error } = await supabase.functions.invoke('grow-create-payment', {
        body: { userId: user.id, email: user.email },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('לא התקבל קישור תשלום מהשרת.');
      window.location.href = data.url; // redirect to Grow hosted page
    } catch (e) {
      setError(e.message || 'שגיאה ביצירת קישור התשלום. נסה שוב.');
      setLoading(false);
    }
  }

  const headline =
    reason === 'trial_expired'
      ? 'תקופת הניסיון הסתיימה'
      : 'נדרש מנוי פעיל';

  return (
    <div className="auth-screen" dir="rtl">
      <div className="auth-card">
        <span className="header-icon big">♠</span>
        <h1>{headline}</h1>
        <p className="auth-sub">
          כדי להמשיך להזין תוצאות ולעדכן נתונים, יש להפעיל מנוי חודשי.
          <br />
          הנתונים הקיימים שלך נשמרים ותמיד נגישים לצפייה.
        </p>

        <div className="price-box">
          <div className="price-amount">{PRICE_ILS}&nbsp;₪</div>
          <div className="price-period">לחודש · ביטול בכל עת</div>
        </div>

        <ul className="perks">
          <li>הזנת תוצאות יומיות ללא הגבלה</li>
          <li>גרפים, לוח שנה וסטטיסטיקות מתקדמות</li>
          <li>גיבוי בענן וסנכרון בין מכשירים</li>
        </ul>

        <button className="btn-primary wide" onClick={handleSubscribe} disabled={loading}>
          {loading ? 'מעביר לתשלום…' : `מעבר לתשלום · ${PRICE_ILS}₪/חודש`}
        </button>

        {error && <div className="form-msg error">{error}</div>}

        <button className="btn-text" onClick={signOut}>
          התנתקות
        </button>
      </div>
    </div>
  );
}
