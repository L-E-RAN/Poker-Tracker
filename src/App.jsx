import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './auth/AuthProvider';
import { ensureProfile, getProfile, computeAccess } from './lib/api';
import Login from './components/Login';
import Paywall from './components/Paywall';
import AppMain from './AppMain';
import './App.css';

function FullScreen({ children }) {
  return (
    <div className="auth-screen" dir="rtl">
      <div className="auth-card">{children}</div>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setStatus('loading');
    setError(null);
    try {
      await ensureProfile(user);
      const p = await getProfile();
      setProfile(p);
      setStatus('ready');
    } catch (e) {
      setError(e.message || 'שגיאה בטעינת הפרופיל.');
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) loadProfile();
    else {
      setProfile(null);
      setStatus('idle');
    }
  }, [user, loadProfile]);

  if (authLoading) {
    return <FullScreen><div className="spinner" /></FullScreen>;
  }

  if (!user) return <Login />;

  if (status === 'loading' || status === 'idle') {
    return <FullScreen><div className="spinner" /></FullScreen>;
  }

  if (status === 'error') {
    return (
      <FullScreen>
        <h1>שגיאה</h1>
        <p className="auth-sub">{error}</p>
        <button className="btn-primary" onClick={loadProfile}>נסה שוב</button>
      </FullScreen>
    );
  }

  const access = computeAccess(profile);
  if (!access.allowed) return <Paywall reason={access.reason} />;

  return <AppMain access={access} />;
}
